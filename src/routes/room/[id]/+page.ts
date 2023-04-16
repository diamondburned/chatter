import type { PageLoad } from "./$types.js";

const load: PageLoad = ({ params }) => {
  return {
    roomID: params.id,
  };
};
