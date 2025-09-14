const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Drivesist.ai server is running' });
});

app.listen(PORT, () => {
    console.log(`Drivesist.ai server is running on http://localhost:${PORT}`);
    console.log(`Access your application at: http://localhost:${PORT}`);
});