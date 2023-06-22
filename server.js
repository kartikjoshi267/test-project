const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const ejs = require('ejs')

const app = express();
const port = 3000;

app.set('view engine', 'ejs');

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb://localhost:27017/newdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Define the TestResult schema
const testResultSchema = new mongoose.Schema({

  date: { type: String, required: true },
  Suite_No: { type: Number, required: true },
  Tests: { type: Number, required: true },
  Pass: { type: Number, required: true },
  Fail: { type: Number, required: true },
  Fail_list: { type: Object, required: true, default: [] },
});

// Define the TestResult model
const TestResult = mongoose.model('TestResult', testResultSchema);
// const testResults = await TestResult.find({});

// Set up Multer for file upload
const upload = multer({ dest: 'uploads/' });

// Handle file upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const fileData = fs.readFileSync(req.file.path, 'utf-8');
    const jsonData = JSON.parse(fileData);
    
    // Iterate over each document in the JSON array
const documents = jsonData.map((doc) => {
  // Assign the Fail_list field as it is
  return doc;
});
    
    await TestResult.insertMany(documents);
    
    res.json({ message: 'File uploaded and data added to the database' });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  } finally {
    // Remove the uploaded file
    fs.unlinkSync(req.file.path);
  }
});

app.get('/', (req, res) => {
  TestResult.find({})
    .then((data) => {
      let processData = {}
      data.map((item)=>{
        if (item['date'] in processData === false){
          processData[item['date']] = [item];
        } else {
          processData[item['date']].push(item);
        }
      });

      let keys = Object.keys(processData);
      keys.sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
      let tempObj = {};
      for (let i = 0; i < keys.length; i++){
        tempObj[keys[i]] = processData[keys[i]];
      }
      processData = tempObj;

      res.render('index', { data: processData });
      // console.log(res.status);
    })
    .catch((err) => {
      console.error('Error retrieving data from MongoDB:', err);
      res.status(500).send('Error retrieving data from MongoDB');
    });
});

app.get('/reportsPage/:id', async (req, res) => {
  const id = req.params.id;
  const docs = await TestResult.findById(id).exec();
  res.render('reportsPage', { data: docs });
  // res.status(500).send('Error retrieving data from mongoose');
})



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});