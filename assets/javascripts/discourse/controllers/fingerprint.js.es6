import { default as computed, on } from 'ember-addons/ember-computed-decorators';
import { popupAjaxError } from 'discourse/lib/ajax-error';

export default Ember.Controller.extend({
	newFingerprint: null,
	user: null,

	@on('init')
	reset() {
		this.setProperties({ newFingerprint: null, callback: null });
	},

	_refreshCount() {
	const callback = this.get('callback');
	if (callback) {
	  callback(this.get('model.length'));
	}
	},

	actions: {

		saveFingerprint(fingerprint) {
		  const note = this.store.createRecord('fpt');
		  const userId = parseInt(this.get('userId'));

		  this.set('saving', true);
		  note.save({ raw: this.get('fingerprint'), user_id: userId }).then(() => {
			this.set('fingerprint', '');
			this.get('model').pushObject(note);
		  }).catch(popupAjaxError).finally(() => this.set('saving', false));
		}

	}

});