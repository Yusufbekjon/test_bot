const express = require('express');
const fs = require('fs');

const app = express();
const port = 3000;

// Test natijalarini yuklash
function loadTestResults() {
    try {
        return JSON.parse(fs.readFileSync('test_results.json', 'utf-8'));
    } catch (e) {
        return {};
    }
}

// Natija so'rovi
app.get('/api/results/:userId', (req, res) => {
    const userId = req.params.userId;
    const testResults = loadTestResults();

    // Foydalanuvchi natijalarini topish
    const userResult = Object.values(testResults).find(user => user.id.toString() === userId);

    if (userResult && userResult.result) {
        res.json({
            correct: userResult.result.correct,
            wrong: userResult.result.incorrect
        });
    } else {
        res.status(404).json({ message: "Natijalar topilmadi" });
    }
});

// Serverni ishga tushirish
app.listen(port, () => {
    console.log(`Server ishlamoqda: http://localhost:${port}`);
});
