import React from 'react';
import ReactDOM from 'react-dom';

import AppComponent from './AppComponent';

class CustomElement extends HTMLElement {
	constructor() {
		super();

		const root = document.createElement('div');

		ReactDOM.render(
			<AppComponent/>, 
			root
		);

		this.appendChild(root);
	}

	connectedCallback() {
	}

	disconnectedCallback() {
	}

}

if (customElements.get('sample-custom-element')) {
	console.log(
		'Skipping registration for <sample-custom-element> (already registered)'
	);
} else {
	customElements.define('sample-custom-element', CustomElement);
}
