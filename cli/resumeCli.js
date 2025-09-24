const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

const resumeDir = path.join(__dirname, "../resumes");

async function main() {
  const name = await ask("Enter Name: ");
  const email = await ask("Enter Email: ");
  const education = await ask("Enter Education: ");
  const experience = await ask("Enter Experience: ");
  const skills = await ask("Enter Skills (comma separated): ");
  const template = await ask("Choose Template (template1/template2/template3/template4/template5): ");

  const resume = { name, email, education, experience, skills, template };
  const id = Date.now().toString();
  await fs.writeFile(path.join(resumeDir, `${id}.json`), JSON.stringify(resume, null, 2));

  console.log(`Resume saved with ID: ${id}`);
  rl.close();
}

main();