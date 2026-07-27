Create a polished, production-quality login page for a cybersecurity learning platform named **Cipher** using **React** and **Tailwind CSS**.

The page should closely match the following visual direction:

## Overall layout

Build a full-screen desktop login page with a clean, modern, minimalistic aesthetic.

Use a two-column split layout:

-   Left side: approximately 52% of the page width
    
-   Right side: approximately 48% of the page width
    
-   Minimum height: `100vh`
    
-   Background: soft white with very subtle cool-gray and blue gradients
    
-   Main color palette:
    
    -   Deep navy: `#0F1B33`
        
    -   Primary blue: `#0B63F6`
        
    -   Bright accent blue: `#1473FF`
        
    -   Muted gray text: `#667085`
        
    -   Border gray: `#D9DEE8`
        
    -   White: `#FFFFFF`
        

The page should feel spacious, premium, and suitable for a modern educational SaaS platform.

Use React functional components and Tailwind CSS utility classes. Do not use Bootstrap or other UI frameworks.

## Page structure

Create the following component structure:

-   `LoginPage`
    
-   `BrandHeader`
    
-   `HeroContent`
    
-   `SecurityIllustration`
    
-   `FeatureList`
    
-   `LoginPanel`
    
-   `LoginForm`
    
-   `SocialLoginButtons`
    

Keep the components reusable and clearly organized.

## Left panel

The left panel should contain the brand, headline, supporting text, cybersecurity artwork, and three feature items.

Use generous padding, approximately:

-   `px-12` to `px-16`
    
-   `py-10` to `py-14`
    

The content should be vertically distributed so the branding appears near the top, the main hero content occupies the center, and the features sit near the bottom.

### Brand header

Place the brand in the upper-left corner.

Include:

-   A blue outlined shield icon containing a small padlock
    
-   Brand name: **Cipher**
    
-   Tagline underneath: **Learn. Protect. Secure.**
    

Typography:

-   Brand name: bold, dark navy, approximately `text-4xl`
    
-   Tagline: muted gray, approximately `text-base`
    
-   Shield icon: approximately 52–60 pixels tall
    
-   Use an icon library such as `lucide-react`
    
-   Suggested icons: `Shield`, `LockKeyhole`, or a combination of both
    

The icon and text should be aligned horizontally with a small gap.

### Main headline

Place the headline below the logo with substantial vertical spacing.

Use two lines:

**Master Cybersecurity.**  
**Build a Safer Future.**

Style:

-   First line: dark navy
    
-   Second line: bright blue
    
-   Large, bold typography
    
-   Approximately `text-5xl` on standard desktop screens
    
-   Use `font-bold` or `font-extrabold`
    
-   Tight line-height
    
-   Maximum text width around 650 pixels
    

### Supporting paragraph

Place a short paragraph below the headline:

“Interactive lessons, hands-on labs, and real-world challenges to level up your skills.”

Style:

-   Muted navy-gray
    
-   Approximately `text-lg`
    
-   Comfortable line-height
    
-   Maximum width around 520 pixels
    

## Cybersecurity illustration

Create a central hero illustration showing:

-   A dark navy laptop
    
-   A glowing blue shield with a lock displayed on the laptop screen
    
-   A small standing padlock to the left of the laptop
    
-   A fingerprint tile near the lower-left
    
-   A code symbol tile near the lower-right
    
-   Very subtle circuit-board lines and nodes in the background
    

The illustration should have a soft 3D or isometric appearance.

Implementation options:

1.  Use a supplied image asset placed in `/public/images/cipher-security-hero.png`
    
2.  Or recreate the composition using CSS, SVG, gradients, and Lucide icons
    

If using an image:

-   Use `object-contain`
    
-   Set the illustration width between 520 and 650 pixels
    
-   Keep it horizontally centered within the left panel
    
-   Add a subtle drop shadow
    
-   Do not stretch or crop the image
    

Add a large, low-opacity pale-blue radial shape behind the laptop to create depth.

The background circuitry should remain extremely subtle so it does not reduce readability.

## Feature list

At the bottom of the left panel, show three horizontally aligned feature items:

1.  **Learn**
    
    -   Icon: open book
        
    -   Description: “Core concepts and real-world skills”
        
2.  **Practice**
    
    -   Icon: laboratory flask
        
    -   Description: “Hands-on labs and simulations”
        
3.  **Protect**
    
    -   Icon: shield with checkmark
        
    -   Description: “Build solutions and stay secure”
        

Use Lucide icons such as:

-   `BookOpen`
    
-   `FlaskConical`
    
-   `ShieldCheck`
    

Style:

-   Icons in primary blue
    
-   Titles in dark navy and semibold
    
-   Descriptions in muted gray
    
-   Compact spacing
    
-   Each item should use a two-column icon-and-text layout
    
-   Distribute the three items evenly across the available width
    

## Right login panel

The right side should appear as a large white card or panel with:

-   Rounded corners around 24–28 pixels
    
-   Very subtle gray border
    
-   Soft shadow
    
-   White background
    
-   Small outer margin from the viewport edges
    

Suggested classes:

-   `rounded-[28px]`
    
-   `border border-slate-200`
    
-   `shadow-[0_20px_60px_rgba(15,23,42,0.08)]`
    

The panel should fill most of the page height while leaving a small margin around it.

Use a centered form container with a maximum width of approximately 570 pixels.

## Registration link

Place this in the top-right corner of the login panel:

“New here? Create an account”

Style:

-   “New here?” in muted gray
    
-   “Create an account” in primary blue
    
-   Medium font size
    
-   Add hover underline or darker blue hover state
    
-   Use an accessible button or anchor element
    

## Login heading

Place the login heading around the upper-middle section of the panel.

Text:

**Welcome back**

Supporting text:

“Login to continue your learning journey.”

Style:

-   Heading: dark navy, bold, around `text-4xl`
    
-   Supporting text: muted gray, around `text-lg`
    
-   Add approximately 10–12 pixels of spacing between them
    

## Login form

Create a functional login form with:

-   Email field
    
-   Password field
    
-   Forgot password link
    
-   Primary login button
    
-   Google login button
    
-   GitHub login button
    

Use React state to manage the input values.

Prevent the default form submission and log or display the submitted values.

### Email input

Label:

**Email address**

Input placeholder:

**Enter your email**

Include a mail icon inside the input on the left.

Style:

-   Height around 62 pixels
    
-   Rounded corners around 12 pixels
    
-   Light-gray border
    
-   White background
    
-   Left padding sufficient for the icon
    
-   Dark text
    
-   Muted placeholder text
    
-   Blue focus border
    
-   Subtle focus ring
    

Suggested classes:

-   `h-16`
    
-   `rounded-xl`
    
-   `border border-slate-300`
    
-   `focus:border-blue-600`
    
-   `focus:ring-4 focus:ring-blue-100`
    

### Password input

Label:

**Password**

Input placeholder:

**Enter your password**

Include:

-   Lock icon on the left
    
-   Eye or eye-off icon button on the right
    
-   Password visibility toggle using React state
    

The icon button must include an accessible `aria-label`.

### Forgot password

Place the forgot password link below the password field and align it to the right.

Text:

**Forgot password?**

Style:

-   Blue
    
-   Medium weight
    
-   Small hover underline
    
-   Approximately `text-sm` or `text-base`
    

## Primary login button

Create a large full-width blue button.

Text:

**Log in**

Include a small shield icon before the text.

Style:

-   Height around 64 pixels
    
-   Rounded corners around 12 pixels
    
-   Blue gradient or solid vibrant blue
    
-   White text
    
-   Semibold
    
-   Subtle shadow
    
-   Smooth hover and active transitions
    

Suggested gradient:

-   `from-blue-600`
    
-   `to-blue-700`
    

Hover behavior:

-   Slightly darker gradient
    
-   Small upward translation
    
-   Stronger shadow
    

Disabled state:

-   Lower opacity
    
-   No translation
    
-   Not-allowed cursor
    

## Social login divider

Below the login button, add a divider with the centered text:

**or continue with**

Structure:

-   Thin horizontal line on both sides
    
-   Muted gray text in the center
    
-   Adequate spacing above and below
    

## Social login buttons

Create two side-by-side buttons:

### Google button

Include:

-   Google “G” logo or a visually accurate Google icon
    
-   Text: **Google**
    

### GitHub button

Include:

-   GitHub icon
    
-   Text: **GitHub**
    

Style for both:

-   Equal width
    
-   Height around 58 pixels
    
-   White background
    
-   Light-gray border
    
-   Rounded corners
    
-   Dark text
    
-   Subtle hover background
    
-   Slight shadow on hover
    
-   Clear keyboard focus state
    

Use a responsive grid:

-   Two columns on desktop
    
-   One column on mobile
    

## Security note

At the bottom-left area of the login panel, add a small security reassurance:

Shield icon followed by:

“Your progress is secure with us.”

Style:

-   Small muted-gray text
    
-   Small outlined shield icon
    
-   Align horizontally
    
-   Keep it visually subtle
    

## Responsive behavior

The design must work well across desktop, tablet, and mobile.

### Desktop

-   Two-column split layout
    
-   Left illustration visible
    
-   Feature list shown horizontally
    
-   Login form vertically centered
    

### Tablet

-   Reduce horizontal padding
    
-   Keep two columns if there is sufficient width
    
-   Scale down the headline and artwork
    
-   Reduce feature descriptions if necessary
    

### Mobile

At widths below approximately 900 pixels:

-   Stack the layout vertically or hide the illustration-heavy left panel
    
-   Keep a compact brand header above the form
    
-   Make the login panel full width
    
-   Remove large outer border radius if needed
    
-   Use `px-5` or `px-6`
    
-   Keep all form controls touch-friendly
    
-   Stack social login buttons vertically
    
-   Ensure no horizontal scrolling
    

## Accessibility

Follow accessibility best practices:

-   Use semantic HTML elements
    
-   Associate every label with its input
    
-   Use `type="email"` for the email field
    
-   Use `type="password"` when password visibility is disabled
    
-   Include visible keyboard focus styles
    
-   Ensure all icons used as controls have accessible labels
    
-   Maintain sufficient color contrast
    
-   Do not rely on color alone to communicate state
    
-   Add autocomplete attributes:
    
    -   Email: `autocomplete="email"`
        
    -   Password: `autocomplete="current-password"`
        

## Interactions

Implement the following interactions:

-   Password visibility toggle
    
-   Form validation for required email and password
    
-   Basic email format validation
    
-   Loading state when the form is submitted
    
-   Disable the submit button while loading
    
-   Display concise inline validation errors
    
-   Add hover and focus effects to all buttons and links
    
-   Social login buttons may use placeholder click handlers
    
-   The create-account and forgot-password links may use placeholder URLs
    

## Technical requirements

Use:

-   React
    
-   Tailwind CSS
    
-   `lucide-react` for icons
    

Avoid:

-   Bootstrap
    
-   Material UI
    
-   Inline CSS unless necessary for a custom shadow or gradient
    
-   Excessive animation
    
-   Dark backgrounds
    
-   Overly decorative effects
    

Write clean, maintainable code.

Return:

1.  The complete React component
    
2.  Any reusable subcomponents
    
3.  Required imports
    
4.  Tailwind class names directly in the JSX
    
5.  A short note explaining where to place the illustration asset
    
6.  No pseudocode
    
7.  No omitted sections
    
8.  Code that can be pasted directly into a React project
    

The final result should feel like a premium cybersecurity education platform: trustworthy, modern, calm, technical, and approachable.
