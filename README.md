# openrest
NodeJS + ElasticSearch + Logstash example

This example imports a CSV file with the data from 500 restaurants including their opening and closing hours to ElasticSearch.
It then allows the user to query which restaurants are open at a given time.

# Overview

1. We'll start an ElasticSearch server locally on port 9200.
2. We'll import the CSV to ElasticSearch using Logstash.
3. We'll run a simple Express server on port 8080 to handle user requests.

# Setting things up

1. Download the latest stable version of ElasticSearch and extract it somewhere, then cd into that directory and execute it:
<code> ./bin/elasticsearch </code>

Now that you have an ElasticSearch server running, leave that terminal open, and let's import the data from the CSV file to ElasticSearch.

2. Download the latest stable version of Logstash and extract it somewhere, then fire up another terminal and cd into the directory where you extracted it, create a file called csv.conf and paste the following into it:

<pre>
input {
    file {
        path => ["/path/to/restaurants.csv"]
        start_position => "beginning"
	sincedb_path => "/dev/null"
    }
}

filter {
    csv {
         columns => [
            "id",
	    "created_at",
            "updated_at",
            "city_id",
            "opening_hr",
            "closing_hr",
            "delivery_charge",
            "description_en",
            "description_ar",
            "menus_count",
            "reviews_count",
            "branches_count",
            "photos_count",
            "name_en",
            "name_ar"
	]
    }
    ruby {
        code => '
            event.set("opening_hr", Time.strptime(event.get("opening_hr"), "%I:%M:%S %p").strftime("%H%M"));
            event.set("closing_hr", Time.strptime(event.get("closing_hr"), "%I:%M:%S %p").strftime("%H%M"));
        '
    }
}

output {
    stdout { codec => rubydebug }
    elasticsearch {
        action => "index"
        hosts => ["127.0.0.1:9200"]
        index => "restaurants"
        document_type => "restaurant"
	document_id => "%{id}"
        workers => 1
    }
}
</pre>

Make sure to replace the path in the third line with the path to restaurants.csv on your PC.

3. We're all set. Make sure you're still in the directory where you extracted Logstash and run the following command:

<code> ./bin/logstash -f csv.conf </code>

Now ElasticSearch is ready for queries.

4. git clone this repo to your PC, then cd into the directory where you cloned it and run the following command to install the required dependencies:

<code> npm install </code>

5. Now start the server, run the following command:

<code> node OpenRest.js </code>

6. Finally, use your browser to test, the URL should look like this:

<code> http://localhost:8080/openAt/HH-MM-PP/PAGE </code>

For example, to see the first 10 results for restaurants open at 10 AM, go to the following URL:

<code> http://localhost:8080/openAt/10-00-AM/0 </code>

Increase the page number for more results.

7. That's it.
