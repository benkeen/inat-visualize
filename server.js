const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 5000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const baseUrl = 'https://api.inaturalist.org/v1';

// 215211 - variable
// 201281 - american lappet moth
// 143615
// 213861

app.get('/api/taxon', (req, res) => {
	const observationId = req.query.id;
	Promise.all([
		axios.get(`${baseUrl}/taxa/${observationId}`)
	]).then((values) => {
		res.send(values[0].data.results[0]);
	});
});

// app.get('/api/taxa', (req, res) => {
// 	Promise.all([
// 		axios.get(`${baseUrl}/taxa?rank=kingdom`),
// 		axios.get(`${baseUrl}/observations/species_counts?rank=kingdom&user_id=${userId}`),
// 		axios.get(`${baseUrl}/observations/taxon_stats.json?user_id=${userId}`)
// 	]).then((values) => {
// 		const found = {};
// 		values[1].data.results.map(({ count, taxon }) => {
// 			found[taxon.id] = { count };
// 		});
//
// 		const cleanData = {
// 			name: 'Kingdoms',
// 			children: values[0].data.results.map((taxon) => ({
// 				name: taxon.name,
// 				totalCount: taxon.observations_count,
// 				numObservations: (found[taxon.id] && found[taxon.id].count) ? found[taxon.id].count : 0,
// 				children: []
// 			}))
// 		};
//
// 		res.send(cleanData);
// 	});
// });


app.listen(port, () => console.log(`Listening on port ${port}`));