const { faker } = require('@faker-js/faker');
const arrayOfMessages = [];
for (let index = 0; index < 300; index++) {
  arrayOfMessages.push({
    phoneNumber: '+918534049674',
    text: 'asdasdasdasd',
  });
}
console.log(arrayOfMessages);
fetch('http://localhost:3000', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: arrayOfMessages,
  }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
