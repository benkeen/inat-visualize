import React, { Component } from 'react';
import './App.css';

class App extends Component {
	constructor (props) {
		super(props);

		this.search = this.search.bind(this);
		this.onChangeObservationId = this.onChangeObservationId.bind(this);
	}

	state = {
		taxonIds: [],
		nextObservationId: '',
		data: []
	};

	callApi = async (observationId) => {
		const response = await fetch(`/api/taxon?id=${observationId}`);
		const body = await response.json();

		if (response.status !== 200) {
			throw Error(body.message);
		}

		return body;
	};

	getTables () {
		return this.state.data.map((data, index) => (
			<table class="table" key={index}>
				<tbody>
				{this.showTable(data)}
				</tbody>
			</table>
		));
	}

	showTable (data) {
		return data.ancestors.map((item) => (
			<tr key={item.id}>
				<td>
					<img src={item.default_photo.square_url} width={32} height={32} alt=""/>
				</td>
				<td>
					{item.rank}
				</td>
				<td>
					{item.name}
					<span>({item.observations_count})</span>
				</td>
			</tr>
		));
	}

	search (e) {
		e.preventDefault();

		this.setState((state) => {

			this.callApi(this.state.nextObservationId)
				.then(res => {
					this.setState((state) => ({
						data: [...state.data, res]
					}));
				})
				.catch(err => console.log(err));

			return {
				taxonIds: [...state.taxonIds, state.nextObservationId],
				nextObservationId: ''
			};
		});
	}

	showSelectedPills () {
		return this.state.taxonIds.map((taxonId) => (
			<span className="pill">
				{taxonId}
				<span>x</span>
			</span>
		));
	}

	onChangeObservationId (e) {
		this.setState({
			nextObservationId: e.target.value
		});
	}

	render () {
		const { nextObservationId } = this.state;

		return (
			<section>
				<form onSubmit={this.search}>
					<input type="text" size={10} value={nextObservationId} onChange={this.onChangeObservationId}/>
					<input type="submit" value="Search" />
				</form>

				<span className="pill-block">
				{this.showSelectedPills()}
				</span>

				<hr size="1" />

				{this.getTables()}
			</section>
		);
	}
}

export default App;
