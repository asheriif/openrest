const express = require('express')
const es = require('elasticsearch')
const app = express()
const port = 8080

const esC = new es.Client({
	host: '127.0.0.1:9200'
})

const constructBody = function constructBody(hh, mm, p, page) {

	hh = parseInt(hh, 10)
	if (p == 'PM' && hh < 12) {
		hh += 12 
	}
	if (p == 'AM' && hh == 12) {
		hh -= 12
	}

	let myKey = hh.toString() + mm
	if(hh < 10) myKey = '0' + myKey

	return body = {
		"size": 10,
		"from": page,
		"query": {
			"query_string": {
				"query": "((opening_hr:<=" + myKey + ") AND (closing_hr:>=" + myKey + "))" +   //open for less than 12 hours
				         " OR ((closing_hr:<=opening_hr) AND (opening_hr:<=" + myKey + "))"    //open for more than 12 hours
			}
		}
	}
}


app.get('/openAt/:hh-:mm-:midi/:page', function (req, response) {
	esC.search({index: 'restaurants', body: constructBody(req.params.hh, req.params.mm, req.params.midi, req.params.page * 10)}, function(err, res, stat) {
		if(err)
			response.send("Error while searching: " + err)
		else {
			if(req.params.page * 10 > res.hits.total) return response.send(`Only ${Math.ceil(res.hits.total / 10)} pages exist for this query.`)
			endpoint = (req.params.page * 10 + 10) <= res.hits.total ? (req.params.page * 10 + 10) : res.hits.total
			out = `Showing ${req.params.page * 10} to ${endpoint} out of ${res.hits.total} restaurants open at ${req.params.hh}:${req.params.mm} ${req.params.midi}: <br><br>`
			res.hits.hits.forEach((hit, index) => out += `${hit._source.name_en} <br>`)
			response.send(out)
		}
	})
})

app.listen(port, function(err) {
	if(err) return console.log(err)
	console.log(`Server up and running. Listening on port: ${port}`)
})
