import { Carousel } from '@/components/common';
import CreateButton from '@/components/store/CreateButton';
import HiddenIcon from '@/components/store/HiddenIcon';
import ItemCard from '@/components/store/ItemCard';
import StoreEditButton from '@/components/store/StoreEditButton';
import { config } from '@/lib';
import { PublicMerchItem } from '@/lib/types/apiResponses';
import { getDefaultMerchItemPhoto } from '@/lib/utils';
import Link from 'next/link';
import styles from './style.module.scss';

interface CollectionSliderProps {
  uuid: string;
  title: string;
  description: string;
  items: PublicMerchItem[];
  storeAdminVisible?: boolean;
  isHidden?: boolean;
}

const CollectionSlider = ({
  uuid,
  title,
  description,
  items,
  storeAdminVisible,
  isHidden,
}: CollectionSliderProps) => {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>
        <Link href={`${config.store.collectionRoute}${uuid}`}>{title}</Link>
        {storeAdminVisible ? <StoreEditButton type="collection" uuid={uuid} /> : null}
        {isHidden ? <HiddenIcon type="collection" /> : null}
      </h3>
      <p className={styles.description}>{description}</p>
      <Carousel>
        {items
          .filter(item => storeAdminVisible || !item.hidden)
          .map(item => (
            <ItemCard
              className={styles.card}
              image={getDefaultMerchItemPhoto(item)}
              title={item.itemName}
              href={`${config.store.itemRoute}${item.uuid}`}
              cost={item.options[0]?.price ?? 0}
              discountPercentage={item.options[0]?.discountPercentage ?? 0}
              outOfStock={item.options.every(option => option.quantity === 0)}
              key={item.uuid}
            >
              {storeAdminVisible && item.hidden ? <HiddenIcon type="item" /> : null}
              {storeAdminVisible ? <StoreEditButton type="item" uuid={item.uuid} /> : null}
            </ItemCard>
          ))}
        {storeAdminVisible ? (
          <CreateButton className={styles.card} type="item" collection={uuid}>
            Add an item
          </CreateButton>
        ) : null}
      </Carousel>
    </div>
  );
};

export default CollectionSlider;
