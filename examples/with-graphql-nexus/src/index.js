require('dotenv').config()
const { app } = require('./app')

const port = parseInt(process.env.PORT, 10) || 4001

app.listen(port, () => console.log(`Listening on http://localhost:${port}/`))
