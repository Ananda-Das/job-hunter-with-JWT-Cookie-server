const express = require('express')
const app = express()
const port = 5000

app.get('/', (req, res) => {
  res.send('Job Hunter is Running!')
})

app.listen(port, () => {
  console.log(`Job Hunter listening on port ${port}`)
})