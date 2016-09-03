export default {
  name: 'fingerprint',
  initialize() {
	
	// load external script
	loadFingerprintJs(function() {

		// generate a fingerprint async
		new Fingerprint2().get(function(result, components){
			console.log(result); // a hash representing device fingerprint

			// try saving
			this.get('controllers.fingerprint').send('saveFingerprint', result);

		});

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