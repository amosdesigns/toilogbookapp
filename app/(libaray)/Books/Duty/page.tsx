import React from 'react'
const duty = true;
const User = {
  name: "Jerome", id: "12345", jobTitle: "Marina Guard"
};
const page = () => {
  return (
    <div>
      <div>
        <Image src="/path/to/image.jpg" alt="User Image" />
        <h1>{duty ? "On Duty" : "Off Duty"}</h1>
        <h2>{User.name}</h2>
        <p>{User.jobTitle}</p>
      </div>
      <div>
        <select name="location" id="location">
          <option value="beach">Beach</option>
          <option value="pool">Pool</option>
          <option value="park">Park</option>
        </select>
        <p className="text-red-600">Please confirm the below list of items:</p>
        <label htmlFor="first-aid-kit">First Aid Kit</label>
        <input
          type="checkbox"
          id="first-aid-kit"
          name="first-aid-kit"
          value="first-aid-kit"
        />

        <label htmlFor="fire-extinguisher">Fire Extinguisher</label>
        <input
          type="checkbox"
          id="fire-extinguisher"
          name="fire-extinguisher"
          value="fire-extinguisher"
        />

        <label htmlFor="ring-buoy">24" USCG Ring Buoy</label>
        <input
          type="checkbox"
          id="ring-buoy"
          name="ring-buoy"
          value="ring-buoy"
        />
        <label htmlFor="throw-rope">49' Ring Buoy Throw Rope</label>
        <input
          type="checkbox"
          id="throw-rope"
          name="throw-rope"
          value="throw-rope"
        />
        <label htmlFor="life-jacket">Life Jacket</label>
        <input
          type="checkbox"
          id="life-jacket"
          name="life-jacket"
          value="life-jacket"
        />
        <label htmlFor="radio">Radio</label>
        <input
          type="checkbox"
          id="radio"
          name="radio"
          value="radio"
        />
      </div>

      <button>{duty ? "Start Duty" : "End Duty"}</button>
    </div>
  );
}

export default page
