import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api/v1';

async function runTests() {
  try {
    console.log('--- 1. Testing Login ---');
    const loginRes = await axios.post(`${BASE_URL}/login`, { username: 'test_user_api' });
    console.log('Login Success:', loginRes.data.success);
    const token = loginRes.data.data.sessionToken;
    console.log('Token received');

    const authHeader = { Authorization: `Bearer ${token}` };

    console.log('\n--- 2. Testing Create Room ---');
    const roomName = `room-${Date.now()}`;
    const createRoomRes = await axios.post(`${BASE_URL}/rooms`, { name: roomName }, { headers: authHeader });
    console.log('Create Room Success:', createRoomRes.data.success);
    const roomId = createRoomRes.data.data.id;
    console.log('Room ID:', roomId);

    console.log('\n--- 3. Testing List Rooms ---');
    const listRoomsRes = await axios.get(`${BASE_URL}/rooms`, { headers: authHeader });
    console.log('List Rooms Success:', listRoomsRes.data.success);
    console.log('Total Rooms:', listRoomsRes.data.data.rooms.length);

    console.log('\n--- 4. Testing Get Room Details ---');
    const getRoomRes = await axios.get(`${BASE_URL}/rooms/${roomId}`, { headers: authHeader });
    console.log('Get Room Success:', getRoomRes.data.success);
    console.log('Room Name:', getRoomRes.data.data.name);

    console.log('\n--- 5. Testing Send Message ---');
    const sendMsgRes = await axios.post(`${BASE_URL}/rooms/${roomId}/messages`, { content: 'Hello from API test!' }, { headers: authHeader });
    console.log('Send Message Success:', sendMsgRes.data.success);
    const msgId = sendMsgRes.data.data.id;

    console.log('\n--- 6. Testing Get Messages ---');
    const getMsgsRes = await axios.get(`${BASE_URL}/rooms/${roomId}/messages`, { headers: authHeader });
    console.log('Get Messages Success:', getMsgsRes.data.success);
    console.log('Messages count:', getMsgsRes.data.data.messages.length);

    console.log('\n--- 7. Testing Delete Room ---');
    const deleteRoomRes = await axios.delete(`${BASE_URL}/rooms/${roomId}`, { headers: authHeader });
    console.log('Delete Room Success:', deleteRoomRes.data.success);

    console.log('\n--- ALL TESTS PASSED ---');
  } catch (error) {
    console.error('\n--- TEST FAILED ---');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

runTests();
