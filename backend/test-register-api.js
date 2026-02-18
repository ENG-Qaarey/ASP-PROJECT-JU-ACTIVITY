
async function testRegister() {
    const payload = {
        name: "Test User",
        email: "test_" + Math.random().toString(36).substring(7) + "@gmail.com",
        password: "Password123!",
        studentId: "123456"
    };

    try {
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testRegister();
