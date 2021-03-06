import { SCRIPT_URLS } from 'common/lib/constants';
import { addScriptTags } from 'common/lib/utilities/script-loader';

import React, { Component } from 'react';
import App from './components/App';

// redux
import { Store } from 'redux';
import { Provider } from 'react-redux';
import configureStore from './store/configureStore';
import {
  loadState as loadStateFromLocalStorage,
  saveState as saveStateToLocalStorage,
} from './store/localStorage';
import {
  loadState as loadStateFromSessionStorage,
  saveState as saveStateToSessionStorage,
} from './store/sessionStorage';

import throttle from 'lodash/throttle';

interface IState {
  hasLoadedScripts: boolean;
  store?: Store;
}

class Editor extends Component<{}, IState> {
  state: IState = { hasLoadedScripts: false };

  constructor(props: any) {
    super(props);
    addScriptTags([SCRIPT_URLS.OFFICE_JS_FOR_EDITOR, SCRIPT_URLS.MONACO_LOADER])
      .then(() => Office.onReady())
      .then(() => loadStateFromLocalStorage())
      .then(localStorageState => {
        const store = configureStore({
          initialState: {
            ...localStorageState,
            ...loadStateFromSessionStorage(),
          },
        });

        store.subscribe(
          throttle(() => {
            const state = store.getState();
            saveStateToLocalStorage(state);
            saveStateToSessionStorage(state);
          }, 1000),
        );

        this.setState({ hasLoadedScripts: true, store });
      });
  }

  render() {
    const { hasLoadedScripts, store } = this.state;
    return hasLoadedScripts ? (
      <Provider store={store}>
        <App />
      </Provider>
    ) : null;
  }
}

export default Editor;
