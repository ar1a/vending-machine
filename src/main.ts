import { Task, chain } from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/pipeable';
import { createInterface } from 'readline';

export const log = (...args: any[]): Task<void> => () =>
  new Promise(resolve => resolve(console.log(...args)));

export const getLine = (question: string): Task<string> => () =>
  new Promise(resolve => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });

pipe(
  getLine('Press enter to continue'),
  chain(() => log('hello world')),
)();
