const express = require('express');
const { spawn } = require('child_process'); 
const router = express.Router();
const authController = require('../controllers/authController.js');
const dbUser = require('../models/User');
const dbOpportunities = require('../models/opportunities');
const dbChat = require('../models/chat');
const dbProduct = require('../models/product'); // Correct model name
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Serve static files from the 'uploads' directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Setup Multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Login Page
router.get('/login', (req, res) => res.render('login'));

// Signup Page
router.get('/signup', (req, res) => res.render('signup'));

// Signup Handle
router.post('/signup', authController.signup);

// Login Handle
router.post('/login', authController.login);

// Logout Handle
router.get('/logout', authController.logout);

// Home Page
router.get('/home', (req, res) => res.render('home'));

// About Page
router.get('/about', (req, res) => res.render('about'));

// Market Page
router.get('/market', (req, res) => res.render('market'));

// Botanists Page
router.get('/botanists', (req, res) => res.render('botanists'));

// Predictions Page
router.get('/predictions', (req, res) => res.render('predictions'));

// Crop Prediction Page
router.get('/crop-prediction', (req, res) => res.render('crop-prediction'));

// Disease Prediction Page
router.get('/diseases', (req, res) => res.render('diseases'));

// Fertilizer Prediction Page
router.get('/fertilizers', (req, res) => res.render('fertilizers'));

// Chat Page
router.get('/chat', (req, res) => res.render('chat'));
router.get('/farmerschat', (req, res) => res.render('farmerschat'));

// Farmers' List Page
router.get('/farmersList', (req, res) => res.render('farmersList'));
router.get('/farmersConnect', (req, res) => res.render('farmersConnect'));

// Investment Opportunities Page
router.get('/investmentopp', (req, res) => res.render('investmentopp'));

// Market Information Page
router.get('/marketInfo', (req, res) => res.render('marketInfo'));
router.get('/marketlist', (req, res) => res.render('marketlist'));

// Profile Page
router.get('/profile', (req, res) => res.render('profile'));
router.get('/farmerProfile', (req, res) => res.render('farmerProfile'));

router.get('/signout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/home'); 
    });
});

// Get all farmers
router.get('/api/users', (req, res) => {
  dbUser.find({ role: 'farmer' }, (err, users) => {
    if (err) return res.status(500).send(err);
    res.send(users);
  });
});

// Get all opportunities
router.get('/api/opportunities', (req, res) => {
  dbOpportunities.find({}, (err, opportunities) => {
    if (err) return res.status(500).send(err);
    res.send(opportunities);
  });
});

// Add a new opportunity
router.post('/api/opportunities', (req, res) => {
  const newOpportunity = {
    name: req.body.name,
    description: req.body.description,
    datePosted: req.body.datePosted
  };
  dbOpportunities.insert(newOpportunity, (err, opportunity) => {
    if (err) return res.status(500).send(err);
    res.send(opportunity);
  });
});

// Update an opportunity
router.put('/api/opportunities/:id', (req, res) => {
  const updatedOpportunity = {
    name: req.body.name,
    description: req.body.description,
    datePosted: req.body.datePosted
  };
  dbOpportunities.update({ _id: req.params.id }, { $set: updatedOpportunity }, {}, (err, numReplaced) => {
    if (err) return res.status(500).send(err);
    res.send({ success: true, numReplaced });
  });
});

// Delete an opportunity
router.delete('/api/opportunities/:id', (req, res) => {
  dbOpportunities.remove({ _id: req.params.id }, {}, (err, numRemoved) => {
    if (err) return res.status(500).send(err);
    res.send({ success: true, numRemoved });
  });
});

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  console.log('User authentication check:', req.isAuthenticated(), req.user);
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.redirect('/auth/login');
}

// Get chat users (ensure user is authenticated)
router.get('/api/chat-users', ensureAuthenticated, (req, res) => {
  const userPhone = req.user.phone;
  dbUser.findOne({ phone: userPhone }, (err, user) => {
    if (err) return res.status(500).send(err);
    if (!user) return res.status(404).send('User not found');

    dbUser.find({ phone: { $in: user.connections } }, (err, users) => {
      if (err) return res.status(500).send(err);
      res.send(users);
    });
  });
});

dbChat.ensureIndex({ sender: 1, receiver: 1 });
dbChat.ensureIndex({ timestamp: 1 });

// Get chat history (ensure user is authenticated)
router.get('/api/chat-history/:phone', ensureAuthenticated, (req, res) => {
  const userPhone = req.user.phone;
  const chatUserPhone = req.params.phone;

  console.log('Fetching chat history between', userPhone, 'and', chatUserPhone);

  dbChat.find({
    $or: [
      { sender: userPhone, receiver: chatUserPhone },
      { sender: chatUserPhone, receiver: userPhone }
    ]
  }).sort({ timestamp: 1 }).exec((err, messages) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).send(err);
    }
    console.log('Found messages:', messages);
    res.send(messages);
  });
});

// Connect to another user by phone (ensure user is authenticated)
router.post('/api/connect/:phone', ensureAuthenticated, (req, res) => {
  const farmerPhone = req.params.phone;
  const userPhone = req.user.phone;

  // Add connection for both users
  Promise.all([
    dbUser.update({ phone: userPhone }, { $addToSet: { connections: farmerPhone } }),
    dbUser.update({ phone: farmerPhone }, { $addToSet: { connections: userPhone } })
  ]).then(() => {
    dbUser.findOne({ phone: farmerPhone }, (err, farmer) => {
      if (err) return res.status(500).send(err);
      res.send({ success: true, farmer });
    });
  }).catch(err => res.status(500).send(err));
});

// Crop prediction
function predictCropFromPython(province, district, month, soilType, rainfall, temperature) {
  return new Promise((resolve, reject) => {
    console.log("running prediction");
    console.log(['machine/cropapp.py',
      '--province', province,
      '--district', district,
      '--month', month,
      '--soil_type', soilType,
      '--rainfall', rainfall,
      '--temperature', temperature
    ]);
    const pythonProcess = spawn('python', ['machine/cropapp.py',
      '--province', province,
      '--district', district,
      '--month', month,
      '--soil_type', soilType,
      '--rainfall', rainfall,
      '--temperature', temperature
    ]);

    let result = '';
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      reject(data.toString());
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(result.trim());
      } else {
        reject(`Python process exited with code ${code}`);
      }
    });
  });
}

router.post("/api/predict-crop", (req, res) => {
  const { province, district, month, soil_type, rainfall, temperature } = req.body;

  console.log("form data: ", province);
  predictCropFromPython(province, district, month, soil_type, rainfall, temperature).then(
    prediction =>{
      return res.send({"result": prediction});
    }
  ).catch(
    error => {
      return res.send({"result": error});
    }
  )
});

// Disease prediction
router.post('/diseases', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = path.join(uploadDir, req.file.filename);
    const pythonProcess = spawn('python', ['machine/diseaseapp.py', filePath]);

    let dataBuffer = '';

    pythonProcess.stdout.on('data', (data) => {
        dataBuffer += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).send('Error processing file');
        }
        try {
            const result = JSON.parse(dataBuffer);
            res.json(result);
        } catch (error) {
            console.error('Error parsing Python output:', error);
            res.status(500).send('Error processing result');
        }
    });
});

// Fertilizers
router.post('/fertilizers', (req, res) => {
  const { nitrogen, phosphorous, potassium, cropname } = req.body;
  
  // Ensure the body contains required fields
  if (!nitrogen || !phosphorous || !potassium || !cropname) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const pythonProcess = spawn('python', ['machine/fertilizerapp.py']);

  pythonProcess.stdin.write(JSON.stringify(req.body));
  pythonProcess.stdin.end();

  let result = '';
  let errorOutput = '';

  pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
  });

  pythonProcess.on('close', (code) => {
      console.log(`child process exited with code ${code}`);

      if (errorOutput) {
        console.error(`stderr: ${errorOutput}`);
      }

      try {
        const parsedResult = JSON.parse(result);
        res.json(parsedResult);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        console.error('Result:', result);
        res.status(500).json({ error: 'Failed to parse JSON response from Python script' });
      }
  });
});

// Send message (ensure user is authenticated)
router.post('/api/send-message/:phone', ensureAuthenticated, (req, res) => {
  const userPhone = req.user.phone;
  const chatUserPhone = req.params.phone;
  const { content } = req.body;

  const message = {
    sender: userPhone,
    receiver: chatUserPhone,
    content: content,
    timestamp: new Date()
  };

  dbChat.insert(message, (err, newMessage) => {
    if (err) return res.status(500).send(err);
    
    // Ensure both users have each other in their connections
    Promise.all([
      dbUser.update({ phone: userPhone }, { $addToSet: { connections: chatUserPhone } }),
      dbUser.update({ phone: chatUserPhone }, { $addToSet: { connections: userPhone } })
    ]).then(() => {
      res.send(newMessage);
    }).catch(err => res.status(500).send(err));
  });
});

// Create a new product
router.post('/api/products', ensureAuthenticated, upload.single('image'), (req, res) => {
  const newProduct = {
    name: req.body.name,
    description: req.body.description,
    price: parseFloat(req.body.price),
    farmerId: req.user._id,
    image: req.file ? req.file.filename : null,
  };
  dbProduct.insert(newProduct, (err, product) => {
    if (err) {
      console.error('Error inserting product:', err);
      return res.status(500).send(err);
    }
    console.log('Inserted product:', product);
    res.send(product);
  });
});

// Get all products
router.get('/api/products', (req, res) => {
  dbProduct.find({}, (err, products) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).send(err);
    }
    console.log('Fetched products:', products);
    res.send(products);
  });
});

// Update a product
router.put('/api/products/:id', ensureAuthenticated, upload.single('image'), (req, res) => {
  const updatedProduct = {
    name: req.body.name,
    description: req.body.description,
    price: parseFloat(req.body.price),
  };
  if (req.file) {
    updatedProduct.image = req.file.filename;
  }
  dbProduct.update({ _id: req.params.id, farmerId: req.user._id }, { $set: updatedProduct }, {}, (err, numReplaced) => {
    if (err) {
      console.error('Error updating product:', err);
      return res.status(500).send(err);
    }
    res.send({ success: true, numReplaced });
  });
});

// Delete a product
router.delete('/api/products/:id', ensureAuthenticated, (req, res) => {
  dbProduct.remove({ _id: req.params.id, farmerId: req.user._id }, {}, (err, numRemoved) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).send(err);
    }
    res.send({ success: true, numRemoved });
  });
});

// Get a single product by ID
router.get('/api/products/:id', (req, res) => {
  dbProduct.findOne({ _id: req.params.id }, (err, product) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).send(err);
    }
    console.log('Fetched product:', product);
    res.send(product);
  });
});

module.exports = router;
