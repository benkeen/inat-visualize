import React, { Component } from 'react';
import './App.css';
import ComparisonGraph from './ComparisonGraph';
// import data1 from './data1';
// import data2 from './data2';


// recurse through the destination tree and append the new taxonomy info. As soon as the tree starts to deviate
// from an original path, add a new entry
const recurseAppend = (sourceArray, dest, parent = "null") => {
	if (!sourceArray.length) {
		return;
	}
	const currItem = sourceArray.shift();
	let added = false;
	dest.forEach((row, index) => {
		if (row.id === currItem.id) {
			if (sourceArray.length) {
				recurseAppend(sourceArray, dest[index].children, currItem.name);
				added = true;
			}
		}
	});

	if (!added) {
		dest.push({
			name: currItem.preferred_common_name ? currItem.preferred_common_name : currItem.name,
			id: currItem.id,
			parent,
			children: []
		});
		appendBranch(sourceArray, dest[dest.length-1].children, currItem.name);
	}
};

// Converts a flat array into a nested object
const appendBranch = (sourceArray, dest, parent = "null") => {
	if (!sourceArray.length) {
		return;
	}
	const currItem = sourceArray.shift();
	dest.push({
		name: currItem.preferred_common_name ? currItem.preferred_common_name : currItem.name,
		id: currItem.id,
		parent,
		children: []
	});
	appendBranch(sourceArray, dest[0].children, currItem.name);
};


class App extends Component {
	constructor (props) {
		super(props);
		this.search = this.search.bind(this);
		this.onChangeObservationId = this.onChangeObservationId.bind(this);
	}

	state = {
		taxonIds: [],
		nextObservationId: '',
		data: [],
		treeData: null
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
			<table className="table" key={index}>
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
					this.setState((state) => {
						let newTreeData = [];

						if (state.treeData === null) {
							appendBranch(res.ancestors, newTreeData);

							console.log(res);
						} else {
							newTreeData = JSON.parse(JSON.stringify(state.treeData));
							recurseAppend(res.ancestors, newTreeData);
						}

						return {
							data: [...state.data, res],
							treeData: newTreeData
						};
					});
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
			<span className="pill" key={taxonId}>
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
		const { nextObservationId, treeData, data } = this.state;

		const treeDataObj = (data.length === 0) ? null : {
			name: treeData[0].name,
			children: treeData[0].children
		};

		console.log(treeDataObj);

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

				<ComparisonGraph data={treeDataObj} numItems={data.length} />
			</section>
		);
	}
}

export default App;
