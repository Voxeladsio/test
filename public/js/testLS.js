const sample = {
  title: "Demo – Cat vs Dog",
  karmaReward: 5,
  passThreshold: 80,
  interfaceXml: `
    <View>
      <Image name="image" value="$image"/>
      <Choices name="answer" toName="image" choice="single">
        <Choice value="Cat"/><Choice value="Dog"/>
      </Choices>
    </View>`,
  tasks: [
    { id: 1, data: { image: "https://loremflickr.com/320/240/cat", correct_answer: "Cat" } },
    { id: 2, data: { image: "https://loremflickr.com/320/240/dog", correct_answer: "Dog" } }
  ]
};

fetch('/api/admin/skilltests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(sample)
})
  .then(r => r.json())
  .then(console.log)        // should show _id, title, etc.
  .catch(console.error);
