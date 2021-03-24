import { randomUniform } from '@tensorflow/tfjs';

function main() {
  const t = randomUniform([2, 1]);
  t.print();
  document.body.innerHTML = 'test';
}

main();
