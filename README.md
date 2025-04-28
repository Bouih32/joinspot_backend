# JOINSPOTS - PFE

JoinSpots is your go-to platform for discovering and creating unforgettable activities across Morocco. Whether you're a tourist seeking authentic local experiences or a local looking to meet new people and explore hidden gems, JoinSpots connects you to vibrant events, adventures, and communities. Create your own activities, join exciting gatherings, and experience Morocco like never before — all in one place.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)
- [Contact](#contact)

## Installation

Follow these steps to set up the project locally:

### Prerequisites

Ensure you have the following installed on your local machine:

- Node
- Git

### Clone the Repository

```bash
git clone https://github.com/Bouih32/joinspot_backend.git
cd joinspot_backend
```

### Install Dependencies

Install all the necessary dependencies in `package.json` file:

```bash
npm install
```

### Setup your prisma envirement

Add your mongodb (preferablly) link to `schema.prisma` file:

```bash
npx prisma db push

```

### Database documentation

Provided bellow id the documentation for all api endpoints for your convinience :

```bash
https://drive.google.com/file/d/1mV6FyEi9OO4XkUWO9WFr0l8Y9MjNB5n5/view?usp=sharing

```

## Usage

Run the Express.js application locally:

1. Add the .env.example variables to your .env file.
2. Make sure you are also running the frontend if you need the ui interactions.
3. Run the express application:

   ```bash
   npm run dev
   ```

4. Open your web browser and navigate to `http://localhost:4000` to see the Express.js app in action.

## License

This project is Starware. If you like it, please give it a star on GitHub. It helps to promote the project and shows appreciation to the developer.

## Contact

If you have any questions or feedback, feel free to reach out:

- Email: bouih.othmane@gmail.com
