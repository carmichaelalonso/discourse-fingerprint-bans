# name: discourse-fingerprint-bans
# about: Plugin for staff users to ban specific browser fingerprints
# version: 1.0.0
# authors: Cameron Carmichael Alonso
# url: https://github.com/carmichaelalonso/discourse-fingerprint-bans

LAST_FINGERPRINT_FIELD = "last_known_fingerprint"

after_initialize do

  require_dependency 'user'

  module ::DiscourseFingerprintBans
    class Engine < ::Rails::Engine
      engine_name "discourse_fingerprint_bans"
      isolate_namespace DiscourseFingerprintBans
    end

    def self.key_for(user_id)
      "fingerprints:#{user_id}"
    end

    def self.fingerprints_for(user_id)
      PluginStore.get('fingerprint_store', key_for(user_id)) || []
    end

    def self.add_fingerprint(user, raw)
      fingerprints = fingerprints_for(user.id)
      record = { id: SecureRandom.hex(16), user_id: user.id, raw: raw, created_at: Time.now }
      fingerprints << record
      ::PluginStore.set("fingerprint_store", key_for(user.id), fingerprints)

      user.custom_fields[LAST_FINGERPRINT_FIELD] = raw
      user.save_custom_fields

      record
    end

    require_dependency 'application_serializer'
    class ::FingerprintsSerializer < ApplicationSerializer
        attributes :id, :user_id, :raw, :created_at

        def id
          object[:id]
        end

        def user_id
          object[:user_id]
        end

        def created_by
          BasicUserSerializer.new(object[:created_by], scope: scope, root: false)
        end

        def created_at
          object[:created_at]
        end

      end

    require_dependency 'application_controller'
    class DiscourseFingerprintBans::FingerprintBansController < ::ApplicationController
        before_filter :ensure_logged_in
        #before_filter :ensure_staff

        def index
          user = User.where(id: params[:user_id]).first
          raise Discourse::NotFound if user.blank?

          fpts = ::DiscourseFingerprintBans.fingerprints_for(params[:user_id])
          render json: {
            extras: { username: user.username },
            fingerprints: create_json()
          }
        end

        def create
          user = User.where(id: params[:user_id]).first
          raise Discourse::NotFound if user.blank?
          fingerprint = ::DiscourseStaffNotes.add_fingerprint(user, params[:raw], current_user.id)

          render json: create_json(fingerprint)
        end


        protected

          def create_json(obj)
            # Avoid n+1
            if obj.is_a?(Array)
              by_ids = {}
              User.where(id: obj.map {|o| o[:created_by] }).each do |u|
                by_ids[u.id] = u
              end
              obj.each {|o| o[:created_by] = by_ids[o[:created_by].to_i] }
            else
              obj[:created_by] = User.where(id: obj[:created_by]).first
            end

            serialize_data(obj, ::FingerprintsSerializer)
          end
      end

      whitelist_staff_user_custom_field(LAST_FINGERPRINT_FIELD)

      add_to_class(Guardian, :can_delete_staff_notes?) do
        (SiteSetting.staff_notes_moderators_delete? && user.staff?) || user.admin?
      end

      DiscourseFingerprintBans::Engine.routes.draw do
        get '/' => 'fingerprints#index'
        post '/' => 'fingerprints#create'
        delete '/:id' => 'fingerprints#destroy'
      end

      Discourse::Application.routes.append do
        mount ::DiscourseFingerprintBans::Engine, at: "/staff_notes"
      end

end