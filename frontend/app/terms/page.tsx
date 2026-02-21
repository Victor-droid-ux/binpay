export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">
        These are the terms and conditions for using Bin-Pay. Please read them
        carefully.
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          By using this service, you agree to comply with all applicable laws
          and regulations.
        </li>
        <li>
          Payments made through Bin-Pay are processed securely and are
          non-refundable.
        </li>
        <li>Your personal data is handled according to our privacy policy.</li>
        <li>
          Bin-Pay is not responsible for errors caused by incorrect information
          provided by users.
        </li>
        <li>For support, contact support@binpay.ng.</li>
      </ul>
    </div>
  );
}
