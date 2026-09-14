const apiKey = 'AIzaSyBpjenDcXDREseIDv5NfgpDo2fAk_gUhdk';
const url = `https://firestore.googleapis.com/v1/projects/reddot-workspace/databases/(default)/documents/organizations/reddot/tasks?key=${apiKey}`;

async function main() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.documents) {
      console.log(`Cloud tasks count: ${data.documents.length}`);
      data.documents.forEach(doc => {
        const id = doc.name.split('/').pop();
        const f = doc.fields;
        console.log(`[${id}] title: ${f?.title?.stringValue}, status: ${f?.status?.stringValue}, assignee: ${f?.assigneeName?.stringValue || f?.assigneeEmail?.stringValue}`);
      });
    } else {
      console.log('No tasks found in cloud Firestore:', data);
    }
  } catch (err) {
    console.error('Error fetching cloud tasks:', err.message);
  }
}

main();
