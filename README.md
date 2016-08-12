# ApolloRxObservable

Here's an implementation of `QueryObservable` that works with RxJS.

---

```ts
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';

const origin = client.watchQuery(options); // QueryObservable
const obs = Observable.from(origin);

origin.refetch(); // works
obs.refetch(); // refetch is undefined
obs.ish.refetch(); // works (it should) because `ish` is a reference to `origin`
```

To solve that problem I created a custom observable called `ApolloRxObservable` that extends `Observable` from RxJS.

`QueryObservable` is saved under `apollo` property. This way I could create methods like `refetch()`, `startPolling()`, `stopPolling()`. Every method uses `ApolloRxObservable.apollo` to call specific method.

---

```ts
import 'rxjs';
import { ApolloRxObservable } from 'apollo-rx-observable';

const origin = client.watchQuery(options); // QueryObservable
const obs = new ApolloRxObservable(origin);

origin.refetch(); // works
obs.refetch(); // works

obs.map(customMapFunction).refetch() // refetch is undefined
```

As you can see, it still won't work with operators. Here's why.

Every operator uses [`Observable.lift()`](https://github.com/ReactiveX/rxjs/blob/master/src/Observable.ts#L60-L72) method, for example [`map()`](https://github.com/ReactiveX/rxjs/blob/master/src/operator/map.ts#L42).

`Observable.lift()` creates new `Observable`, then assigns the current observable under `source` property. Here the moment where our custom methods (refetch etc) are being dropped.


I solved this by [overwriting `lift()` method](https://github.com/kamilkisiela/apollo-rx-observable/blob/master/src/index.ts#L17-L24).

Now, the `lift()` method creates a new instance of `ApolloRxObservable` instead of `Observable`, and passes the `QueryObservable` from  `apollo` property in the constructor.

Every operator returns now `ApolloRxObservable`.

```ts
import 'rxjs';
import { ApolloRxObservable } from 'apollo-rx-observable';

const origin = client.watchQuery(options); // QueryObservable
const obs = new ApolloRxObservable(origin);

origin.refetch(); // works
obs.refetch(); // works

obs.map(customMapFunction).refetch() // works
```

---

**Problem with `subscribe` method**

An example

```ts
import 'rxjs';
import { ApolloRxObservable } from 'apollo-rx-observable';

const origin = client.watchQuery(options); // QueryObservable
const obs = new ApolloRxObservable(origin);

obs.subscribe() // an error
```

It happens because there is no `_subscription` method inside the ApolloRxObservable.

Even if we add one, we still need to subscibe to the `QueryObservable` (`this.apollo`).

I [solved this here](https://github.com/kamilkisiela/apollo-rx-observable/blob/master/src/index.ts#L46-L49).

So now we can subscribe to an Observable at any point.

```ts
import 'rxjs';
import { ApolloRxObservable } from 'apollo-rx-observable';

const origin = client.watchQuery(options); // QueryObservable
const obs = new ApolloRxObservable(origin);

obs.map(result => result.data).subscribe(data => this.data = data);
```
