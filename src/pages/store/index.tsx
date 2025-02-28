import {
  CollectionSlider,
  CreateButton,
  HelpModal,
  Hero,
  HiddenIcon,
  ItemCard,
  Navbar,
  StoreEditButton,
} from '@/components/store';
import { config, showToast } from '@/lib';
import { StoreAPI } from '@/lib/api';
import withAccessType, { GetServerSidePropsWithAuth } from '@/lib/hoc/withAccessType';
import { CookieService, PermissionService } from '@/lib/services';
import { PrivateProfile, PublicMerchCollection } from '@/lib/types/apiResponses';
import { CookieType } from '@/lib/types/enums';
import { getDefaultMerchCollectionPhoto } from '@/lib/utils';
import styles from '@/styles/pages/StoreHomePage.module.scss';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

type View = 'collections' | 'all-items';

function getPath(view: View): string {
  const params = new URLSearchParams();
  if (view === 'all-items') {
    params.set('view', 'all');
  }
  const query = params.toString();
  return query ? `${config.store.homeRoute}?${query}` : config.store.homeRoute;
}

interface HomePageProps {
  user: PrivateProfile;
  view: View;
  collections: PublicMerchCollection[];
  previewPublic: boolean;
}
const StoreHomePage = ({
  user: { credits, accessType },
  view,
  collections,
  previewPublic,
}: HomePageProps) => {
  const router = useRouter();

  const [helpOpen, setHelpOpen] = useState(false);

  const storeAdminVisible =
    PermissionService.canEditMerchItems.includes(accessType) && !previewPublic;

  const visibleCollections = collections.filter(
    collection => storeAdminVisible || !collection.archived
  );

  return (
    <>
      <div className={styles.container}>
        <Navbar balance={credits} />
      </div>
      <Hero onHelp={() => setHelpOpen(true)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>{view === 'collections' ? 'Browse our collections' : 'Browse all items'}</h2>
          {storeAdminVisible ? (
            <button
              type="button"
              className={styles.viewToggle}
              onClick={() => {
                CookieService.setClientCookie(CookieType.USER_PREVIEW_ENABLED, 'member');
                showToast(
                  'Previewing store as member',
                  'To re-enable admin store options, go to admin settings.',
                  [
                    {
                      text: 'Admin settings',
                      onClick: () => router.push(config.admin.homeRoute),
                    },
                  ]
                );
                router.replace(config.store.homeRoute);
              }}
            >
              View store as member
            </button>
          ) : null}
          <Link
            className={styles.viewToggle}
            href={getPath(view === 'collections' ? 'all-items' : 'collections')}
            scroll={false}
          >
            {view === 'collections' ? 'See all items' : 'See collections'}
          </Link>
        </div>
        {view === 'collections' ? (
          <div className={styles.collections}>
            {visibleCollections.map(collection => (
              <ItemCard
                image={getDefaultMerchCollectionPhoto(collection)}
                title={collection.title}
                description={collection.description}
                href={`${config.store.collectionRoute}${collection.uuid}`}
                key={collection.uuid}
              >
                {storeAdminVisible && collection.archived ? <HiddenIcon type="collection" /> : null}
                {storeAdminVisible ? (
                  <StoreEditButton type="collection" uuid={collection.uuid} />
                ) : null}
              </ItemCard>
            ))}
            {storeAdminVisible ? (
              <CreateButton type="collection">Create a collection</CreateButton>
            ) : null}
          </div>
        ) : (
          <>
            {visibleCollections.map(collection => (
              <CollectionSlider
                uuid={collection.uuid}
                title={collection.title}
                description={collection.description}
                items={collection.items}
                storeAdminVisible={storeAdminVisible}
                isHidden={storeAdminVisible && collection.archived}
                key={collection.uuid}
              />
            ))}
            {storeAdminVisible ? (
              <CreateButton type="collection" horizontal>
                Create a collection
              </CreateButton>
            ) : null}
          </>
        )}
      </div>
    </>
  );
};

export default StoreHomePage;

const getServerSidePropsFunc: GetServerSidePropsWithAuth = async ({
  req,
  res,
  query,
  authToken,
}) => {
  const preview = CookieService.getServerCookie(CookieType.USER_PREVIEW_ENABLED, { req, res });

  const collections = await StoreAPI.getAllCollections(authToken);

  return {
    props: {
      title: 'The ACM Store',
      description:
        'Shop the ACM Store for exclusive ACM merchandise including shirts, hoodies, pop sockets & more!',
      view: query.view === 'all' ? 'all-items' : 'collections',
      collections,
      previewPublic: preview === 'member',
    },
  };
};

export const getServerSideProps = withAccessType(
  getServerSidePropsFunc,
  PermissionService.loggedInUser
);
