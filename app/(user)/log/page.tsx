import React from 'react'

const page = () => {
  return (
    <div>
      <h1>create a log entry</h1>
      <form className="flex flex-col gap-4">
        time: <input type="time" />
        date: <input type="date" />
        location: <input type="text" />
        description: <textarea />
        <button className="flex p-4 m-4 bg-blue-600 font-bold text-white rounded-2xl">Submit</button>
      </form>
    </div>
  );
}

export default page
