import React, {FC} from 'react';
import {connect} from 'react-redux';

import {RootState, UserInputType, JournalType} from 'types';
import {dateToString, toCSV} from 'utils';

interface Balance {
  ACCOUNT: string;
  DESCRIPTION: string;
  DEBIT: number;
  CREDIT: number;
  BALANCE: number;
}

interface ConnectProps {
  balance: Balance[];
  totalCredit: number;
  totalDebit: number;
  userInput: UserInputType;
}

const BalanceOutput: FC<ConnectProps> = ({balance, totalCredit, totalDebit, userInput}) => {
  if (!userInput.format || !userInput.startPeriod || !userInput.endPeriod) return null;

  return (
    <div className="output">
      <p>
        Total Debit: {totalDebit} Total Credit: {totalCredit}
        <br />
        Balance from account {userInput.startAccount || '*'} to {userInput.endAccount || '*'} from period{' '}
        {dateToString(userInput.startPeriod)} to {dateToString(userInput.endPeriod)}
      </p>
      {userInput.format === 'CSV' ? <pre>{toCSV(balance)}</pre> : null}
      {userInput.format === 'HTML' ? (
        <table className="table">
          <thead>
            <tr>
              <th>ACCOUNT</th>
              <th>DESCRIPTION</th>
              <th>DEBIT</th>
              <th>CREDIT</th>
              <th>BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {balance.map((entry, i) => (
              <tr key={i}>
                <th scope="row">{entry.ACCOUNT}</th>
                <td>{entry.DESCRIPTION}</td>
                <td>{entry.DEBIT}</td>
                <td>{entry.CREDIT}</td>
                <td>{entry.BALANCE}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
};

export default connect(
  (state: RootState): ConnectProps => {
    let balance: Balance[] = [];

    /* YOUR CODE GOES HERE */
    const {userInput, accounts, journalEntries} = state;
    if (
      accounts.length > 0 &&
      journalEntries.length > 0 &&
      userInput.format &&
      userInput.startAccount &&
      userInput.endPeriod
    ) {
      const {startAccount, endPeriod} = userInput;
      const endAccount = userInput.endAccount || accounts[accounts.length - 1].ACCOUNT;
      const startPeriod =
        userInput.startPeriod && !isNaN(userInput.startPeriod.getTime())
          ? userInput.startPeriod
          : journalEntries[0].PERIOD;

      const filteredJournalEntries = journalEntries
        .filter(
          (entry) =>
            entry.PERIOD >= startPeriod &&
            entry.PERIOD <= endPeriod &&
            entry.ACCOUNT >= startAccount &&
            entry.ACCOUNT <= endAccount,
        )
        .reduce((acc: any, currentEntry: JournalType) => {
          acc[currentEntry.ACCOUNT.toString()] = [...(acc[currentEntry.ACCOUNT.toString()] || []), currentEntry];
          return acc;
        }, {});

      balance = accounts
        .filter(
          (account) =>
            account.ACCOUNT >= startAccount &&
            account.ACCOUNT <= endAccount &&
            Object.keys(filteredJournalEntries).includes(account.ACCOUNT.toString()),
        )
        .map((account) => {
          const jEntries = filteredJournalEntries[account.ACCOUNT.toString()] || [];

          const debit = jEntries.reduce((acc: number, cur: JournalType) => acc + cur.DEBIT, 0);
          const credit = jEntries.reduce((acc: number, cur: JournalType) => acc + cur.CREDIT, 0);

          const entry: Balance = {
            ACCOUNT: account.ACCOUNT.toString(),
            DESCRIPTION: account.LABEL,
            DEBIT: debit,
            CREDIT: credit,
            BALANCE: debit - credit,
          };
          return entry;
        });
    }

    const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
    const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

    return {
      balance,
      totalCredit,
      totalDebit,
      userInput: state.userInput,
    };
  },
)(BalanceOutput);
