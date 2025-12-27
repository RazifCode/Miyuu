import { spawn } from "child_process"

function start() {
  const p = spawn(process.argv[0], ["main.js", ...process.argv.slice(2)], {
    stdio: ["inherit", "inherit", "inherit", "ipc"]
  }).on("message", msg => {
    if (msg == "restart") {
      p.kill()
      start()
    }
  }).on("exit", code => {
    if (!(code == null)) {
      p.kill()
      start()
    }
  }).on("error", console.error)
}

start()