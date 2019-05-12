const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const port = process.env.PORT || 5000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/taxa', (req, res) => {
	const url = 'https://api.inaturalist.org/v1/taxa?rank=kingdom';

	request.get({ url }, (error, response, body) => {
		const json = JSON.parse(body);
		const cleanData = json.results.map((taxon) => ({
			name: taxon.name,
			children: []
		}));
		res.send({
			name: "Kingdoms",
			children: cleanData
		});
	}).end();
});

app.listen(port, () => console.log(`Listening on port ${port}`));