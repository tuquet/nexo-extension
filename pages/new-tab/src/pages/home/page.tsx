import { Button } from '@extension/ui';
import { Link } from 'react-router-dom';

const HomePage = () => (
  <main className="flex-1 overflow-y-auto p-6">
    <div className="mx-auto max-w-3xl py-16 text-center sm:py-24">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-100">
        Chào mừng đến với CG
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
        Trợ lý sáng tạo của bạn. Biến ý tưởng thành kịch bản phim hoàn chỉnh và tạo ra các tài sản hình ảnh, video một
        cách dễ dàng.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link to="/script/new">
          <Button size="lg">Bắt đầu tạo kịch bản</Button>
        </Link>
        <Link to="/script">
          <Button variant="outline" size="lg">
            Xem kịch bản đã lưu
          </Button>
        </Link>
      </div>
    </div>
  </main>
);

export default HomePage;
