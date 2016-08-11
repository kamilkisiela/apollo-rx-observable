import { ApolloRxObservable } from '../src';
import { mockClient } from './_mocks';

import gql from 'graphql-tag';

import 'rxjs/add/operator/map';

const query = gql`
  query heroes {
    allHeroes {
      heroes {
        name
      }
    }
  }
`;
const data = {
  allHeroes: {
    heroes: [{ name: 'Mr Foo' }, { name: 'Mr Bar' }],
  },
};

describe('ApolloRxObservable', () => {
  let obsApollo;
  let obsRx;
  let client;

  beforeEach(() => {
    client = mockClient({
      request: { query },
      result: { data },
    });
    obsApollo = client.watchQuery({ query });
    obsRx = new ApolloRxObservable(obsApollo);
  });

  describe('regular', () => {
    it('should be able to subscribe', () => {
      expect(() => {
        obsRx.subscribe({
          next() {}
        });
      }).not.toThrow();
    });

    it('should be able to receive data', (done) => {
      obsRx.subscribe({
        next(result) {
          expect(result.data).toEqual(data);
          done();
        }
      });
    });

    it('should be able to receive an error', (done) => {
      obsRx.subscribe({
        next() {}
      });

      obsRx.subscribe({
        error() {
          done();
        }
      })
    });

    it('should be able to use a operator', (done) => {
      obsRx.map(result => result.data).subscribe({
        next(result) {
          expect(result).toEqual(data);
          done();
        }
      });
    });
  });

  describe('apollo-specific', () => {
    it('should be able to refech', () => {
      spyOn(obsApollo, 'refetch').and.returnValue('promise');

      const arg = 'foo';
      const result = obsRx.refetch(arg);

      expect(obsApollo.refetch).toHaveBeenCalledWith(arg);
      expect(result).toBe('promise');
    });

    it('should be able to startPolling', () => {
      spyOn(obsApollo, 'startPolling');

      const arg = 200;
      obsRx.startPolling(arg);

      expect(obsApollo.startPolling).toHaveBeenCalledWith(arg);
    });

    it('should be able to stopPolling', () => {
      spyOn(obsApollo, 'stopPolling');

      obsRx.stopPolling();

      expect(obsApollo.stopPolling).toHaveBeenCalled();
    });

    it('should be able to fetchMore', () => {
      spyOn(obsApollo, 'fetchMore');

      const arg = 200;
      obsRx.fetchMore(arg);

      expect(obsApollo.fetchMore).toHaveBeenCalledWith(arg);
    });
  });
});
