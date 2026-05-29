import React, { useId } from 'react';
import { Camera } from 'lucide-react';
import { zaptroCompressImageToDataUrl } from '../../utils/zaptroDriverSelfProfile';

type Props = {
  photoUrl: string | null;
  name?: string;
  fallbackIcon: React.ReactNode;
  onChange: (url: string | null) => void;
  label?: string;
};

export const ZaptroModalLandscapeAvatar: React.FC<Props> = ({
  photoUrl,
  name,
  fallbackIcon,
  onChange,
  label = 'Alterar foto',
}) => {
  const inputId = useId();

  return (
    <label htmlFor={inputId} className="zaptro-modal-landscape-hero__photo" title={label} aria-label={label}>
      {photoUrl ? (
        <img src={photoUrl} alt="" className="zaptro-modal-landscape-hero__photo-img" />
      ) : (
        <span className="zaptro-modal-landscape-hero__photo-fallback">
          {name?.trim()?.[0]?.toUpperCase() || fallbackIcon}
        </span>
      )}
      <span className="zaptro-modal-landscape-hero__photo-badge" aria-hidden>
        <Camera size={12} strokeWidth={2.5} />
      </span>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void (async () => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            const url = await zaptroCompressImageToDataUrl(f, 256, 0.85);
            if (url) onChange(url);
          })();
        }}
      />
    </label>
  );
};

export default ZaptroModalLandscapeAvatar;
