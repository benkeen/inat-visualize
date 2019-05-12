import React, { Component } from 'react';
import Graph from './Graph';
import './App.css';

class App extends Component {
	state = {
		kingdoms: []
	};

	componentDidMount() {
		this.callApi()
			.then(res => this.setState({ kingdoms: res }))
			.catch(err => console.log(err));
	}

	callApi = async () => {
		const response = await fetch('/api/taxa');
		const body = await response.json();

		if (response.status !== 200) {
			throw Error(body.message);
		}

		return body;
	};

	render () {
		const { kingdoms } = this.state;

		// if (!kingdoms.length) {
		// 	return null;
		// }

		return (
			<div className="App">
				<Graph kingdoms={kingdoms} />
			</div>
		);
	}
}

export default App;
