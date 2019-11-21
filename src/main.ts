import {
  TaskEither,
  chain,
  map,
  rightTask,
  left,
  right,
  fold,
} from 'fp-ts/lib/TaskEither';
import { Task, task, chain as tChain } from 'fp-ts/lib/Task';
// import { right as eRight } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold as monoidFold, monoidSum } from 'fp-ts/lib/Monoid';
import { filter } from 'fp-ts/lib/Array';
import { createInterface } from 'readline';

export const log = (...args: any[]): Task<void> => () =>
  new Promise(resolve => resolve(console.log(...args)));

export const getLine = (question: string = ''): Task<string> => () =>
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

const getCoin = (input: string): number => {
  switch (input) {
    case '10c':
      return 10;
    case '20c':
      return 20;
    case '50c':
      return 50;
    case '$1':
      return 100;
    case '$2':
      return 200;
  }
  return 0; // TODO: Throw an error instead of 0
};

interface Choice {
  name: string;
  price: number;
}

const choices: Choice[] = [
  { name: 'Mars bar', price: 250 },
  { name: 'Ferrero Rocher Box', price: 310 },
  { name: 'Organic Raw Bar', price: 200 },
];

export const getValidChoices = (money: number, choices: Choice[]): Choice[] =>
  filter((choice: Choice) => choice.price < money)(choices);

const sum = monoidFold(monoidSum);

const getMoney = (coins: number[]): Task<number> =>
  pipe(
    getLine(),
    tChain(a =>
      a === '' ? task.of(sum(coins)) : getMoney([...coins, getCoin(a)]),
    ),
  );

const moneyString = (input: number): string => `$${(input / 100).toFixed(2)}`;

const choiceDialog = (choices: Choice[]): string[] =>
  choices.map(
    (choice, i) => `[${i}] ${choice.name} (${moneyString(choice.price)})`,
  );

const getChoice = (choices: Choice[]): TaskEither<string, Choice> =>
  pipe(
    rightTask(log(choiceDialog(choices).join('\n'))),
    chain(() => rightTask(getLine('Please enter number: \n'))),
    chain(input =>
      +input < choices.length && +input >= 0
        ? right(choices[+input])
        : left('Invalid choice'),
    ),
  );

pipe(
  log('Please enter coins, valid coins are 10c, 20c, 50c, $1, $2\n'),
  tChain(() => log('Insert coins (press enter to finish): ')),
  tChain(() => getMoney([])),
  rightTask,
  chain(money =>
    pipe(
      right(getValidChoices(money, choices)),
      chain((choices: Choice[]) =>
        choices.length === 0
          ? left("You can't afford anything!")
          : right(choices),
      ),
      chain(choices => getChoice(choices)),
      map(
        choice =>
          `Here is your ${choice.name} and your change is ${moneyString(
            money - choice.price,
          )}`,
      ),
    ),
  ),
  fold(log, log),
  // chain(choices => choices === [] ? ),
)();
