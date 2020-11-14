import React from 'react';

import { Link, Route } from 'react-router-dom';
import Documents from './Components/Documents';
import Buckets from './Components/Buckets';

function App() {
    return (
        <div>
            <aside>
                <Link to={{ pathname: '/', state: { foo: 'bar' } }}>Buckets</Link>
                <Link to={{ pathname: '/documents', state: { foo: 'bar2' } }}>Documetns</Link>
            </aside>
            <main>
                <Route exact path='/' component={Buckets} />
                <Route path='/documents' component={Documents} />
            </main>
        </div>
    );
}
export default App;