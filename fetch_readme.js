const fs = require('fs');

async function fetchReadme() {
  const res = await fetch('https://raw.githubusercontent.com/alistaitsacle/free-llm-api-keys/main/README.md');
  const text = await res.text();
  console.log(text.substring(0, 1500));
}

fetchReadme();
