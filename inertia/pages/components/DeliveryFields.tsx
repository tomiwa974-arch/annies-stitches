export interface DeliveryAddress {
  recipient: string
  phone: string
  address: string
  addressExtra: string
  city: string
  state: string
  country: string
  postalCode: string
}
export const emptyDelivery: DeliveryAddress = {
  recipient: '',
  phone: '',
  address: '',
  addressExtra: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
}
export default function DeliveryFields({
  value,
  onChange,
  errors = {},
  disabled = false,
}: {
  value: DeliveryAddress
  onChange: (value: DeliveryAddress) => void
  errors?: Record<string, string>
  disabled?: boolean
}) {
  return (
    <div className="delivery-fields">
      {(
        [
          ['recipient', 'Recipient name', 'name', 120],
          ['phone', 'Phone number', 'tel', 40],
          ['address', 'Street address', 'address-line1', 300],
          ['addressExtra', 'Apartment, landmark or directions (optional)', 'address-line2', 300],
          ['city', 'City / town', 'address-level2', 120],
          ['state', 'State / region', 'address-level1', 120],
          ['country', 'Country', 'country-name', 120],
          ['postalCode', 'Postal code (optional)', 'postal-code', 30],
        ] as const
      ).map(([key, label, autoComplete, maxLength]) => (
        <label key={key}>
          <span>{label}</span>
          <input
            name={key}
            type={key === 'phone' ? 'tel' : 'text'}
            autoComplete={autoComplete}
            maxLength={maxLength}
            required={key !== 'addressExtra' && key !== 'postalCode'}
            disabled={disabled}
            value={value[key]}
            onChange={(event) => onChange({ ...value, [key]: event.target.value })}
            aria-invalid={Boolean(errors[key])}
          />
          {errors[key] && (
            <small role="alert" className="profile-error">
              {errors[key]}
            </small>
          )}
        </label>
      ))}
    </div>
  )
}
