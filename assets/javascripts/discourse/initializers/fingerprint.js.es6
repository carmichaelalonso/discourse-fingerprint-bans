import { withPluginApi } from 'discourse/lib/plugin-api';

export default {
  name: 'fingerprint',
  initialize() {
	
	// load external script
	loadFingerprintJs(function() {

		// generate a fingerprint async
		new Fingerprint2().get(function(result, components){
			console.log(result); // a hash representing device fingerprint
		});

	});

	withPluginApi('0.2', api => {

      function showBlockModal(userId, callback) {
        return loadScript('defer/html-sanitizer-bundle').then(() => {
          return store.find('blocked_fingerprints', { user_id: userId }).then(model => {
            const controller = showModal('staff-notes', { model, title: 'fingerprint_ban.title' });
            controller.reset();
            controller.set('userId', userId);
            controller.set('callback', callback);
            return controller;
          });
        });
      }

      function widgetShowBlockModal() {
        showBlockModal(this.attrs.user_id, function() {
          this.sendWidgetAction('showBlockModal');
        });
      }

      api.attachWidgetAction('post', 'showBlockModal', function() {
        const cfs = this.model.get('user_custom_fields') || {};
        this.model.set('user_custom_fields', cfs);
      });

      /*const UserController = container.lookupFactory('controller:user');
      UserController.reopen({

        _modelChanged: function() {

        }.observes('model').on('init'),

        actions: {
          showStaffNotes() {
            const user = this.get('model');
            showStaffNotes(user.get('id'));
          }
        }
      });*/

      api.decorateWidget('post-admin-menu:after', dec => {
        return dec.attach('post-admin-menu-button', {
          icon: 'pencil',
          label: 'fingerprint_ban.title',
          action: 'showBlockModal'
        });
      });

      api.attachWidgetAction('post-admin-menu', 'showBlockModal', widgetShowBlockModal);

    });

  }
};

function loadFingerprintJs(callback) {

	// setup fingerprintjs2 script source
	const fpjs2 = document.createElement('script'); 
	fpjs2.type = 'text/javascript'; 
	fpjs2.id ="fingerprint_gen";
	fpjs2.src = '//cdn.jsdelivr.net/fingerprintjs2/1.4.1/fingerprint2.min.js';

	// add to parent and load
	const s = document.getElementsByTagName('script')[0]; 
	s.parentNode.insertBefore(fpjs2, s);

	// bind "ready" state event to callback function for when script is loaded
	fpjs2.onreadystatechange = callback;
	fpjs2.onload = callback;

}