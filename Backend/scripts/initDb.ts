
import { query } from '../src/config/db';
import { createSchema } from '../src/db/createSchema';

const main = async () => {
  try {
    await createSchema(query);
    console.log('All tables created!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exitCode = 1;
  }
};

main();
