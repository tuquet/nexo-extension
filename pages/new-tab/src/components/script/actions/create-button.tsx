import { Button } from '@extension/ui';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateButton = () => (
  <Link to="/script/new">
    <Button>
      <PlusCircle className="mr-2 h-4 w-4" />
      Tạo kịch bản mới
    </Button>
  </Link>
);

export default CreateButton;
