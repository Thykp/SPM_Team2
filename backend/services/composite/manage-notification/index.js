const express = require('express');
const cors = require('cors');
const preferencesRoutes = require('./api/preferencesRoutes');
const publishRoutes = require('./api/publishRoutes')

const app = express();
app.use(cors());
app.use(express.json());

app.use('/preferences', preferencesRoutes);
app.use('/publish', publishRoutes);

PORT = 4202

app.listen(PORT, () => console.log(`Manage-Notifications Microservice running on port ${PORT}`));
