import React, { useEffect, useState } from 'react';
import { events, invoke } from '@forge/bridge';

function App() {
  const [data, setData] = useState(null);

  const handleFetchSuccess = (data) => {
    setData(data);
    if (Object.keys(data).length === 0) {
      throw new Error('No properties returned');
    }
  };
  const handleFetchError = () => {
    console.error('Failed to get properties');
  };

  useEffect(() => {
    const fetchProperties = async () => invoke('fetchIssueData');
    fetchProperties().then(handleFetchSuccess).catch(handleFetchError);
    const subscribeForIssueChangedEvent = () =>
      events.on('JIRA_ISSUE_CHANGED', () => {
        fetchProperties().then(handleFetchSuccess).catch(handleFetchError);
      });
    const subscription = subscribeForIssueChangedEvent();

    return () => {
      subscription.then((subscription) => subscription.unsubscribe());
    };
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }
  const properties = Object.entries(data).map(([key, value]) => (
    <div key={key}>
      <strong>{key}:</strong> {JSON.stringify(value, null, 2)}
    </div>
  ));

  const textSummary = Object.entries(data)
    .filter(([key, value]) => typeof value === 'string')
    .map(([key, value]) => value)
    .join(' ');

  return (
    <div>
      <span>Issue properties:</span>
      <div>{properties}</div>
      <div>
        <strong>Summary:</strong> {textSummary}
      </div>
    </div>
  );
}

export default App;
