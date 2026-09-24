import { PartnerTabs } from '../components/partner/PartnerTabs';
import { PartnerTownSelect } from '../components/partner/PartnerTownSelect';
import { PostedSpotList } from '../components/partner/PostedSpotList';
import { ReviewList } from '../components/partner/ReviewList';
import { SpotPostForm } from '../components/partner/SpotPostForm';
import { ReportView } from '../components/report/ReportView';
import { townById } from '../data/towns';
import { PARTNER_TOWN_IDS } from '../lib/partner';
import { useRoute, navigate } from '../state/useRoute';

/** 投稿者ページ（N6・N4-1） */
export function PartnerPage() {
  const route = useRoute();
  const rawTown = route.page === 'partner' ? route.town : null;
  const tab = route.page === 'partner' ? route.tab : 'post';
  // 声とスポットのデータを持つ5町だけを選べる。それ以外は未選択として扱う
  const town = rawTown && PARTNER_TOWN_IDS.includes(rawTown) ? rawTown : null;
  const unsupported = rawTown && !town ? townById(rawTown) : undefined;

  return (
    <main className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto w-full max-w-[880px] space-y-5 px-4 py-6">
        <h1 className="text-xl font-bold">投稿者ページ</h1>
        <PartnerTownSelect
          value={town}
          onChange={(next) => navigate({ page: 'partner', town: next, tab }, { replace: true })}
        />
        {unsupported && (
          <p role="status" className="text-sm text-muted">
            {unsupported.name}はまだ声とスポットのデータがありません
          </p>
        )}
        {town === null ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            町を選んでください
          </p>
        ) : (
          <PartnerTabs value={tab} onChange={(next) => navigate({ page: 'partner', town, tab: next }, { replace: true })}>
            {tab === 'post' && (
              <div className="space-y-6">
                <SpotPostForm key={town} townId={town} />
                <PostedSpotList townId={town} />
              </div>
            )}
            {tab === 'reviews' && <ReviewList townId={town} />}
            {tab === 'report' && <ReportView townId={town} />}
          </PartnerTabs>
        )}
      </div>
    </main>
  );
}
