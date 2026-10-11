import { CLOSING_STAR_GROUPS } from '../content'

export const LandingClosingStarfield = () => (
  <div className='landing-closing-stars' aria-hidden='true'>
    {CLOSING_STAR_GROUPS.map((group, groupIndex) => (
      <div
        key={group.id}
        className='landing-closing-star-layer'
        data-closing-star-layer={groupIndex}
      >
        {group.stars.map((star) => (
          <span
            key={star.id}
            className='landing-closing-star'
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
            }}
          />
        ))}
      </div>
    ))}
  </div>
)
