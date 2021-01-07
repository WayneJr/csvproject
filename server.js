const express        = require('express'),
      app            = express(),
      request        = require('request-promise'),
      crypto         = require('crypto'),



   port        = process.env.PORT || 4000;



app.use(express.urlencoded({extended: false}));
app.use(express.json());


app.post('/', async (req, res, next) => {
    const {url, select_fields} = req.body.csv;
    let ext = url.slice(url.length - 4);
    if (ext !== '.csv') return res.statusCode(400).json({error: "Please enter a valid csv file in url"})

    request.get(url).then(csv => {
        // Get all the titles
        let titles = csv.slice(0, csv.indexOf('\n')).split(',');
        let newTitles = [];
        // Cleanse them from extra quotes they might have
        titles.forEach(title => {
            if (title.includes('"')) title = title.replace(/"/g, '');
            newTitles.push(title);
        });
        titles = [...newTitles];
        console.log(titles);
        // filter out the titles that are not requested
        newTitles = newTitles.filter(title => select_fields.includes(title));
        const titleNumbers = newTitles.map(title => {
            title = titles.indexOf(title);
            return title;
        })
        console.log(newTitles);
        console.log(titleNumbers);
        // Get all the remaining rows that are values
        const rows = csv.slice(csv.indexOf('\n') + 1).split('\n');
        const result =  rows.map(row => {
            const values = row.split(',');
            let newValues = [];
            // Cleanse them from extra quotes they might have
            values.forEach(value => {
                if (value.includes('"')) value = value.replace(/"/g, '');
                newValues.push(value);
            });

            // filter out values that don't have the same index as the requested properties
            newValues = newValues.filter(value => titleNumbers.includes(newValues.indexOf(value)));
            // console.log(newValues)
            return newTitles.reduce((object, curr, i) => (object[curr] = newValues[i], object), {})
        });
        

        return res.json({
              conversion_key: crypto.randomBytes(32).toString().slice(0, 32);
              json: JSON.parse(JSON.stringify(result))
        });
    })
    
})


app.listen(port, () => console.log(`listening on port: ${port}`));
