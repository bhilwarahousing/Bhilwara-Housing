import React, { createContext, useContext, useState, useEffect } from 'react';
import FirstTimeLangModal from '../components/FirstTimeLangModal';

const PreferencesContext = createContext(null);

export const translations = {
  en: {
    // Navigation
    'nav.properties': 'Properties',
    'nav.expertise': 'Expertise',
    'nav.collection': 'Collection',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Dashboard',
    'nav.my_dashboard': 'My Dashboard',
    'nav.browse_properties': 'Browse Properties',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.buyer_portal': 'Buyer Portal',
    'nav.owner_portal': 'Owner Portal',
    'nav.admin_panel': 'Admin Panel',

    // Hero
    'hero.tag': 'Elevating Your Living Experience',
    'hero.title_pre': 'Elevating Your',
    'hero.title_italic': 'Living',
    'hero.title_post': 'Experience',
    'hero.subtitle': 'Explore exclusive villas, luxury penthouses, and prime residential estates in Bhilwara’s finest neighborhoods.',
    'hero.search_placeholder': 'Search by locality, area, or property type…',
    'hero.find_btn': 'FIND',
    'hero.buy': 'Buy',
    'hero.rent': 'Rent',
    'hero.commercial': 'Commercial',
    'hero.plots': 'Plots',

    // Expertise
    'expertise.tag': 'OUR EXPERTISE',
    'expertise.title': 'Comprehensive Real Estate Solutions',
    'expertise.desc': 'Whether you are buying your dream home, seeking high-yield investments, or listing luxury estates in Bhilwara, our specialized team delivers transparent and exceptional service.',
    'expertise.card1_title': 'Property Consulting',
    'expertise.card1_desc': 'Personalized property search and advisory tailored to your luxury lifestyle requirements and family preferences.',
    'expertise.card2_title': 'Legal & Documentation',
    'expertise.card2_desc': 'End-to-end title verification, RERA compliance checking, and seamless legal registry assistance in Rajasthan.',
    'expertise.card3_title': 'Investment Advisory',
    'expertise.card3_desc': 'Data-driven market insights and ROI analysis to help you make smart property investments in Bhilwara’s growing market.',
    'expertise.card4_title': 'Property Management',
    'expertise.card4_desc': 'Complete tenant management, rental agreement administration, and property upkeep for non-resident owners.',

    // Luxury Collection
    'collection.tag': 'CURATED LUXURY LIVING',
    'collection.title': 'Experience Unmatched Elegance',
    'collection.desc': 'Discover an exclusive portfolio of handpicked architectural marvels designed with world-class amenities in Bhilwara.',
    'collection.explore_btn': 'EXPLORE COLLECTION',
    'collection.feat1_title': 'Prime Locations',
    'collection.feat1_desc': 'Handpicked properties in Bhilwara’s most prestigious and sought-after neighbourhoods.',
    'collection.feat2_title': 'Architectural Marvels',
    'collection.feat2_desc': 'Modern architecture blended with timeless Rajasthani grandeur and luxury finishes.',
    'collection.feat3_title': 'Private Amenities',
    'collection.feat3_desc': 'Infinity pools, landscaped courtyards, smart home automation, and 24/7 security.',

    // Contact
    'contact.tag': 'GET IN TOUCH',
    'contact.title': 'Let Us Help You Find Your Next Home',
    'contact.subtitle': 'Our luxury property specialists in Bhilwara are ready to assist you.',
    'contact.name_label': 'Full Name',
    'contact.name_placeholder': 'Your full name',
    'contact.email_label': 'Email Address',
    'contact.email_placeholder': 'your@email.com',
    'contact.phone_label': 'Phone Number',
    'contact.phone_placeholder': '+91 94600 00000',
    'contact.interest_label': 'Interested In',
    'contact.interest_placeholder': 'e.g. 4 BHK Villa in Shastri Nagar',
    'contact.msg_label': 'Message',
    'contact.msg_placeholder': 'Tell us about your requirements, budget, or preferred localities…',
    'contact.send_btn': 'SEND ENQUIRY',
    'contact.sending': 'SENDING…',
    'contact.success': 'Thank you! Your enquiry has been received. Our team will contact you shortly.',

    // Auth Modal
    'auth.login_tab': 'Sign In',
    'auth.register_tab': 'Create Account',
    'auth.login_title': 'Welcome Back',
    'auth.login_subtitle': 'Sign in to access your saved properties and enquiries',
    'auth.register_title': 'Join Bhilwara Housing',
    'auth.register_subtitle': 'Create your account to discover and list premium properties',
    'auth.role_buyer': 'I am a Buyer',
    'auth.role_owner': 'I am an Owner / Agent',
    'auth.quick_demo': 'One-Click Demo Credentials:',
    'auth.guest_search_title': 'Find Your Luxury Home',
    'auth.guest_search_subtitle': 'Enter a location, neighborhood or property type in Bhilwara',
    'auth.continue_as_guest': 'Browse as Guest →',
    'auth.login_to_continue': 'Sign In for Full Experience',
    'auth.welcome_back': 'Welcome Back',
    'auth.login_sub': 'Sign in to your Bhilwara Housing account',
    'auth.email_placeholder': 'Email Address',
    'auth.password_placeholder': 'Password',
    'auth.login_btn': 'Login',
    'auth.no_account': "Don't have an account?",
    'auth.register_link': 'Register',
    'auth.create_account': 'Create Account',
    'auth.register_sub': 'Enter your details to receive an email verification code',
    'auth.full_name': 'Full Name',
    'auth.phone_optional': 'Phone Number (optional)',
    'auth.create_password': 'Create Password (min 6 chars)',
    'auth.i_am_a': 'I am a…',
    'auth.role_buyer_tenant': 'Buyer / Tenant',
    'auth.role_owner_agent': 'Property Owner',
    'auth.continue_otp': 'Continue with Email OTP',
    'auth.sending_otp': 'Sending Verification Code…',
    'auth.already_account': 'Already have an account?',
    'auth.login_link': 'Login',
    'auth.back_to_details': 'Back to details',
    'auth.verify_email_title': 'Verify Your Email',
    'auth.verify_email_sub': 'We sent a 6-digit verification code to',
    'auth.enter_otp_label': 'Enter 6-Digit Code',
    'auth.verifying_code': 'Verifying Account…',
    'auth.verify_complete_btn': 'Verify & Complete Registration',
    'auth.resend_code': 'Resend Verification Code',
    'auth.resend_in': 'Resend code in',

    // Change Password
    'auth.change_pass_title': 'Security & Password',
    'auth.change_pass_sub': 'Update your password regularly to keep your account safe',
    'auth.current_pass_label': 'Current Password',
    'auth.enter_current_pass': 'Enter current password',
    'auth.new_pass_label': 'New Password',
    'auth.enter_new_pass': 'Enter new password (min 6 chars)',
    'auth.confirm_new_pass_label': 'Confirm New Password',
    'auth.reenter_new_pass': 'Re-enter new password',
    'auth.update_pass_btn': 'Update Password',
    'auth.updating_pass': 'Updating Password…',
    'auth.current_pass_req': 'Please enter your current password.',
    'auth.pass_min_length': 'New password must be at least 6 characters.',
    'auth.pass_mismatch': 'New passwords do not match.',
    'auth.pass_change_success': 'Password updated successfully!',
    'auth.pass_change_failed': 'Failed to update password. Please try again.',

    // Properties Search Catalog
    'catalog.title': 'Luxury Properties in Bhilwara',
    'catalog.subtitle': 'Explore handpicked villas, duplex penthouses, and premium apartments across prime locations in Rajasthan.',
    'catalog.filter_title': 'Filter Properties',
    'catalog.reset': 'Reset',
    'catalog.keyword': 'Search Keyword / Locality',
    'catalog.type': 'Property Type',
    'catalog.listing': 'Listing Type',
    'catalog.bedrooms': 'Max Bedrooms (BHK)',
    'catalog.furnishing': 'Furnishing',
    'catalog.max_price': 'Max Budget',
    'catalog.showing': 'Showing properties',
    'catalog.no_results': 'No properties found matching your search criteria.',
    'catalog.clear_filters': 'Clear all filters',

    // Property Details
    'detail.back': 'Back to Search',
    'detail.overview': 'Property Overview',
    'detail.specs': 'Specifications',
    'detail.amenities': 'Luxury Amenities',
    'detail.location': 'Locality & Map',
    'detail.verified_owner': 'Verified Property Owner',
    'detail.direct_call': 'Call Seller Directly',
    'detail.send_enquiry': 'Send an Enquiry',
    'detail.schedule_visit': 'Schedule a Site Visit',
    'detail.visit_date': 'Preferred Date',
    'detail.visit_time': 'Preferred Time Slot',
    'detail.visit_notes': 'Notes / Instructions',
    'detail.book_visit_btn': 'Book Visit Now',
    'detail.save_property': 'Save Property',
    'detail.saved': 'Saved to Favorites',

    // User Dashboard
    'user.welcome': 'Welcome back',
    'user.buyer_badge': 'Buyer Portal',
    'user.quick_explore': 'Explore Properties',
    'user.quick_saved': 'Saved Properties',
    'user.quick_enquiries': 'My Enquiries',
    'user.tab_overview': 'Overview',
    'user.tab_favorites': 'Saved Favorites',
    'user.tab_enquiries': 'Sent Enquiries',
    'user.tab_visits': 'Scheduled Visits',
    'user.tab_profile': 'Profile & Settings',

    // Owner Dashboard
    'owner.welcome': 'Welcome',
    'owner.portal_badge': 'Owner Portal',
    'owner.add_btn': '+ Add Property',
    'owner.tab_props': 'My Properties',
    'owner.tab_enquiries': 'Buyer Enquiries',
    'owner.tab_analytics': 'Analytics & Views',
    'owner.tab_profile': 'Owner Profile',
    'owner.stat_total': 'Properties',
    'owner.stat_active': 'Active Listings',
    'owner.stat_pending': 'Pending Approval',
    'owner.stat_enquiries': 'Enquiries',
    'owner.call_buyer': 'Call Buyer',
    'owner.mark_done': 'Mark as Done',
    'owner.done_badge': 'Done / Resolved',
    'owner.pending_badge': 'Action Pending',
    'owner.reopen': 'Reopen',
    'owner.filter_all': 'All Enquiries',
    'owner.filter_pending': 'Pending',
    'owner.filter_done': 'Resolved / Done',
    'owner.view_map': 'View Location on Map',
    'owner.view_listing': 'View Listing',
    'owner.location_modal_title': 'Enquiry Property Location',

    // Admin Dashboard
    'admin.title': 'System Administration',
    'admin.badge': 'Platform Admin',
    'admin.tab_pending': 'Pending Approvals',
    'admin.tab_all_props': 'All Listings',
    'admin.tab_users': 'Users & Owners',
    'admin.tab_stats': 'Platform Stats',
    'admin.approve_btn': 'Approve & Publish',
    'admin.reject_btn': 'Reject Listing',
    'admin.add_user_btn': '+ Add User',

    // Footer
    'footer.tagline': 'Bhilwara’s premier luxury real estate portal connecting discerning buyers and property owners.',
    'footer.quick_links': 'Quick Links',
    'footer.legal': 'Privacy Policy & Terms',
    'footer.rights': 'All rights reserved.',

    // Common
    'common.dark_mode': 'Dark Mode',
    'common.light_mode': 'Light Mode',
    'common.language': 'Language',
    'common.save': 'Save',
    'common.saved': 'Saved',
    'common.view_details': 'View Details',
    'common.back_to_search': 'Back to Search',
    'common.go_to_dashboard': 'Go to My Dashboard',

    // Property Card & Listing Statuses
    'card.for_buy': 'For Buy',
    'card.for_rent': 'For Rent',
    'card.sold': 'SOLD 🏷️',
    'card.rented': 'RENTED 🏷️',
    'card.bath': 'Bath',
    'card.floor': 'Flr',
    'card.floors': 'Flrs',
    'card.by': 'By:',
    'card.verified': 'Verified',
    'card.verified_owner': 'Verified Owner',

    // Role Labels
    'role.buyer': 'Buyer',
    'role.owner': 'Owner',
    'role.admin': 'Admin',

    // Property Details Additional
    'detail.total_floors': 'Total Floors',
    'detail.bedrooms_count': 'Bedrooms',
    'detail.bathrooms_count': 'Bathrooms',
    'detail.built_area': 'Built-up Area',
    'detail.furnishing_status': 'Furnishing Status',
    'detail.property_type': 'Property Type',
    'detail.listing_type': 'Listing Type',
    'detail.price': 'Price',
    'detail.address': 'Address',
    'detail.locality': 'Locality',
    'detail.city': 'City',
    'detail.state': 'State',
    'detail.key_specs': 'Key Specifications',
    'detail.listed_by': 'Listed By',
    'detail.open_maps': 'Open in Google Maps',

    // Contact Form
    'contact.office_address': 'Office Address',
    'contact.phone_numbers': 'Phone Numbers',
    'contact.email_address': 'Email',
    'contact.looking_header': 'Looking for a property in Bhilwara?',
    'contact.looking_desc': 'Visit our office in R.C. Vyas Colony or reach out via phone or email for guided assistance and direct owner connections.',
    'contact.msg_sent': 'Message Sent!',

    // Location Picker
    'map.interactive_picker': 'Interactive Location Picker',
    'map.picker_subtitle': 'Click anywhere on the map or drag the pin to set the property location',
    'map.quick_jump': 'Quick Bhilwara Locality Jump:',
    'map.open_gmaps': 'Open in Google Maps ↗',
    'map.gps_coords': 'GPS Coordinates — updates live when you move the pin',
    'map.use_my_location': 'Use My Current GPS Location',
  },
  hi: {
    // Navigation
    'nav.properties': 'संपत्तियां',
    'nav.expertise': 'हमारी विशेषज्ञता',
    'nav.collection': 'लक्जरी कलेक्शन',
    'nav.contact': 'संपर्क करें',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.my_dashboard': 'मेरा डैशबोर्ड',
    'nav.browse_properties': 'संपत्तियां देखें',
    'nav.login': 'लॉग इन',
    'nav.logout': 'लॉग आउट',
    'nav.buyer_portal': 'क्रेता पोर्टल',
    'nav.owner_portal': 'मालिक पोर्टल',
    'nav.admin_panel': 'एडमिन पैनल',

    // Hero
    'hero.tag': 'आपके जीवन के अनुभव को उत्कृष्ट बनाना',
    'hero.title_pre': 'आपके जीवन को',
    'hero.title_italic': 'उत्कृष्ट',
    'hero.title_post': 'बनाना',
    'hero.subtitle': 'भीलवाड़ा के सबसे प्रतिष्ठित इलाकों में शानदार विला, डुप्लेक्स पेंटहाउस और प्रीमियम आवासीय संपत्तियां खोजें।',
    'hero.search_placeholder': 'इलाका, क्षेत्र या संपत्ति प्रकार से खोजें…',
    'hero.find_btn': 'खोजें',
    'hero.buy': 'खरीदें',
    'hero.rent': 'किराया',
    'hero.commercial': 'व्यावसायिक',
    'hero.plots': 'प्लॉट्स',

    // Expertise
    'expertise.tag': 'हमारी विशेषज्ञता',
    'expertise.title': 'संपूर्ण रियल एस्टेट समाधान',
    'expertise.desc': 'चाहे आप अपने सपनों का घर खरीद रहे हों, अच्छे रिटर्न वाला निवेश तलाश रहे हों या अपनी संपत्ति लिस्ट कर रहे हों, हमारी टीम पारदर्शी और उत्कृष्ट सेवा प्रदान करती है।',
    'expertise.card1_title': 'प्रॉपर्टी परामर्श',
    'expertise.card1_desc': 'आपकी जीवनशैली और पारिवारिक प्राथमिकताओं के अनुसार व्यक्तिगत प्रॉपर्टी खोज और सलाह।',
    'expertise.card2_title': 'कानूनी व दस्तावेजी सहायता',
    'expertise.card2_desc': 'संपूर्ण टाइटल सत्यापन, रेरा (RERA) अनुपालन और राजस्थान में सुगम रजिस्ट्री सहायता।',
    'expertise.card3_title': 'निवेश सलाहकार',
    'expertise.card3_desc': 'भीलवाड़ा के बढ़ते रियल एस्टेट बाजार में स्मार्ट निवेश के लिए डेटा-आधारित बाजार विश्लेषण।',
    'expertise.card4_title': 'संपत्ति प्रबंधन',
    'expertise.card4_desc': 'किरायेदार प्रबंधन, रेंटल एग्रीमेंट और अनिवासी मालिकों की संपत्ति की पूरी देखरेख।',

    // Luxury Collection
    'collection.tag': 'विशिष्ट लक्जरी जीवनशैली',
    'collection.title': 'अद्वितीय भव्यता और आराम का अनुभव करें',
    'collection.desc': 'भीलवाड़ा में विश्वस्तरीय सुविधाओं से सुसज्जित चुने हुए वास्तुशिल्प चमत्कारों का विशेष संग्रह देखें।',
    'collection.explore_btn': 'कलेक्शन देखें',
    'collection.feat1_title': 'प्रमुख स्थान',
    'collection.feat1_desc': 'भीलवाड़ा के सबसे प्रतिष्ठित और पसंदीदा इलाकों में चुनिंदा संपत्तियां।',
    'collection.feat2_title': 'शानदार वास्तुशिल्प',
    'collection.feat2_desc': 'आधुनिक वास्तुकला और राजस्थानी भव्यता का बेजोड़ संगम।',
    'collection.feat3_title': 'निजी सुविधाएं',
    'collection.feat3_desc': 'स्विमिंग पूल, सुंदर बगीचे, स्मार्ट होम ऑटोमेशन और 24/7 सुरक्षा।',

    // Contact
    'contact.tag': 'संपर्क करें',
    'contact.title': 'अपना पसंदीदा घर खोजने में हमारी मदद लें',
    'contact.subtitle': 'भीलवाड़ा में हमारे लक्जरी संपत्ति विशेषज्ञ आपकी सहायता के लिए तैयार हैं।',
    'contact.name_label': 'पूरा नाम',
    'contact.name_placeholder': 'अपना पूरा नाम दर्ज करें',
    'contact.email_label': 'ईमेल पता',
    'contact.email_placeholder': 'your@email.com',
    'contact.phone_label': 'फ़ोन नंबर',
    'contact.phone_placeholder': '+91 94600 00000',
    'contact.interest_label': 'रुचि का क्षेत्र / प्रकार',
    'contact.interest_placeholder': 'उदा. शास्त्री नगर में 4 BHK विला',
    'contact.msg_label': 'संदेश',
    'contact.msg_placeholder': 'अपनी आवश्यकताएं, बजट या पसंदीदा स्थान बताएं…',
    'contact.send_btn': 'पूछताछ भेजें',
    'contact.sending': 'भेजा जा रहा है…',
    'contact.success': 'धन्यवाद! आपकी पूछताछ प्राप्त हो गई है। हमारी टीम जल्द ही आपसे संपर्क करेगी।',

    // Auth Modal
    'auth.login_tab': 'लॉग इन',
    'auth.register_tab': 'नया खाता बनाएं',
    'auth.login_title': 'स्वागत है',
    'auth.login_subtitle': 'अपनी सहेजी गई संपत्तियों और पूछताछ के लिए साइन इन करें',
    'auth.register_title': 'भीलवाड़ा हाउसिंग से जुड़ें',
    'auth.register_subtitle': 'प्रीमियम संपत्तियों की खोज और लिस्टिंग के लिए खाता बनाएं',
    'auth.role_buyer': 'मैं खरीदार (Buyer) हूँ',
    'auth.role_owner': 'मैं संपत्ति मालिक / एजेंट हूँ',
    'auth.quick_demo': 'एक-क्लिक डेमो खाते:',
    'auth.guest_search_title': 'अपना सपनों का घर खोजें',
    'auth.guest_search_subtitle': 'भीलवाड़ा में कोई भी स्थान या संपत्ति प्रकार दर्ज करें',
    'auth.continue_as_guest': 'अतिथि के रूप में खोजें →',
    'auth.login_to_continue': 'पूर्ण अनुभव के लिए लॉग इन करें',
    'auth.welcome_back': 'पुनः आपका स्वागत है',
    'auth.login_sub': 'अपने भीलवाड़ा हाउसिंग खाते में साइन इन करें',
    'auth.email_placeholder': 'ईमेल पता दर्ज करें',
    'auth.password_placeholder': 'पासवर्ड दर्ज करें',
    'auth.login_btn': 'लॉग इन करें',
    'auth.no_account': 'क्या आपका खाता नहीं है?',
    'auth.register_link': 'पंजीकरण करें',
    'auth.create_account': 'नया खाता बनाएं',
    'auth.register_sub': 'ईमेल सत्यापन कोड प्राप्त करने के लिए अपना विवरण दर्ज करें',
    'auth.full_name': 'पूरा नाम',
    'auth.phone_optional': 'फ़ोन नंबर (वैकल्पिक)',
    'auth.create_password': 'पासवर्ड बनाएं (न्यूनतम 6 अक्षर)',
    'auth.i_am_a': 'मैं हूँ…',
    'auth.role_buyer_tenant': 'खरीदार / किरायेदार',
    'auth.role_owner_agent': 'संपत्ति मालिक',
    'auth.continue_otp': 'ईमेल ओटीपी (OTP) के साथ आगे बढ़ें',
    'auth.sending_otp': 'सत्यापन कोड भेजा जा रहा है…',
    'auth.already_account': 'क्या आपके पास पहले से खाता है?',
    'auth.login_link': 'लॉग इन करें',
    'auth.back_to_details': 'वापस विवरण पर जाएं',
    'auth.verify_email_title': 'अपना ईमेल सत्यापित करें',
    'auth.verify_email_sub': 'हमने 6-अंकों का सत्यापन कोड भेजा है:',
    'auth.enter_otp_label': '6-अंकों का कोड दर्ज करें',
    'auth.verifying_code': 'खाता सत्यापित किया जा रहा है…',
    'auth.verify_complete_btn': 'सत्यापित करें और पंजीकरण पूरा करें',
    'auth.resend_code': 'सत्यापन कोड पुनः भेजें',
    'auth.resend_in': 'पुनः कोड भेजें',

    // Change Password
    'auth.change_pass_title': 'सुरक्षा व पासवर्ड परिवर्तन',
    'auth.change_pass_sub': 'अपने खाते को सुरक्षित रखने के लिए नियमित रूप से पासवर्ड अपडेट करें',
    'auth.current_pass_label': 'वर्तमान पासवर्ड',
    'auth.enter_current_pass': 'वर्तमान पासवर्ड दर्ज करें',
    'auth.new_pass_label': 'नया पासवर्ड',
    'auth.enter_new_pass': 'नया पासवर्ड दर्ज करें (न्यूनतम 6 अक्षर)',
    'auth.confirm_new_pass_label': 'नए पासवर्ड की पुष्टि करें',
    'auth.reenter_new_pass': 'नया पासवर्ड पुनः दर्ज करें',
    'auth.update_pass_btn': 'पासवर्ड अपडेट करें',
    'auth.updating_pass': 'पासवर्ड अपडेट हो रहा है…',
    'auth.current_pass_req': 'कृपया अपना वर्तमान पासवर्ड दर्ज करें।',
    'auth.pass_min_length': 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
    'auth.pass_mismatch': 'नए पासवर्ड आपस में मेल नहीं खाते।',
    'auth.pass_change_success': 'पासवर्ड सफलतापूर्वक अपडेट कर दिया गया है!',
    'auth.pass_change_failed': 'पासवर्ड अपडेट करने में विफल। कृपया पुनः प्रयास करें।',

    // Properties Search Catalog
    'catalog.title': 'भीलवाड़ा में लक्जरी संपत्तियां',
    'catalog.subtitle': 'राजस्थान के प्रमुख स्थानों पर चुनिंदा विला, डुप्लेक्स पेंटहाउस और प्रीमियम अपार्टमेंट्स देखें।',
    'catalog.filter_title': 'फ़िल्टर करें',
    'catalog.reset': 'रीसेट',
    'catalog.keyword': 'स्थान या कीवर्ड खोजें',
    'catalog.type': 'संपत्ति प्रकार',
    'catalog.listing': 'लिस्टिंग प्रकार',
    'catalog.bedrooms': 'अधिकतम बेडरूम (BHK)',
    'catalog.furnishing': 'फर्निशिंग स्थिति',
    'catalog.max_price': 'अधिकतम बजट',
    'catalog.showing': 'कुल संपत्तियां प्रदर्शित',
    'catalog.no_results': 'आपकी खोज के अनुसार कोई संपत्ति नहीं मिली।',
    'catalog.clear_filters': 'सभी फ़िल्टर हटाएं',

    // Property Details
    'detail.back': 'वापस खोज पर जाएं',
    'detail.overview': 'संपत्ति अवलोकन',
    'detail.specs': 'विशेषताएं और माप',
    'detail.amenities': 'लक्जरी सुविधाएं',
    'detail.location': 'स्थान और नक्शा',
    'detail.verified_owner': 'सत्यापित संपत्ति मालिक',
    'detail.direct_call': 'मालिक को सीधे कॉल करें',
    'detail.send_enquiry': 'पूछताछ भेजें',
    'detail.schedule_visit': 'विजिट शेड्यूल करें',
    'detail.visit_date': 'पसंदीदा तारीख',
    'detail.visit_time': 'पसंदीदा समय',
    'detail.visit_notes': 'विशेष निर्देश / नोट्स',
    'detail.book_visit_btn': 'विजिट बुक करें',
    'detail.save_property': 'सहेजें',
    'detail.saved': 'पसंदीदा में सहेजा गया',

    // User Dashboard
    'user.welcome': 'नमस्ते, स्वागत है',
    'user.buyer_badge': 'क्रेता पोर्टल',
    'user.quick_explore': 'संपत्तियां खोजें',
    'user.quick_saved': 'सहेजी गई संपत्तियां',
    'user.quick_enquiries': 'मेरी पूछताछ',
    'user.tab_overview': 'डैशबोर्ड अवलोकन',
    'user.tab_favorites': 'सहेजे गए पसंदीदा',
    'user.tab_enquiries': 'भेजी गई पूछताछ',
    'user.tab_visits': 'शेड्यूल की गई विजिट्स',
    'user.tab_profile': 'प्रोफ़ाइल व सेटिंग्स',

    // Owner Dashboard
    'owner.welcome': 'नमस्ते',
    'owner.portal_badge': 'मालिक पोर्टल',
    'owner.add_btn': '+ संपत्ति जोड़ें',
    'owner.tab_props': 'मेरी संपत्तियां',
    'owner.tab_enquiries': 'क्रेता पूछताछ',
    'owner.tab_analytics': 'विश्लेषण व व्यूज',
    'owner.tab_profile': 'मालिक प्रोफ़ाइल',
    'owner.stat_total': 'कुल संपत्तियां',
    'owner.stat_active': 'सक्रिय लिस्टिंग्स',
    'owner.stat_pending': 'मंजूरी लंबित',
    'owner.stat_enquiries': 'कुल पूछताछ',
    'owner.call_buyer': 'कॉल करें',
    'owner.mark_done': 'पूर्ण चिह्नित करें',
    'owner.done_badge': 'पूर्ण हो गया',
    'owner.pending_badge': 'लंबित कार्रवाई',
    'owner.reopen': 'पुनः खोलें',
    'owner.filter_all': 'सभी पूछताछ',
    'owner.filter_pending': 'लंबित',
    'owner.filter_done': 'पूर्ण / हल किया गया',
    'owner.view_map': 'नक्शे पर स्थान देखें',
    'owner.view_listing': 'संपत्ति देखें',
    'owner.location_modal_title': 'पूछताछ संपत्ति का स्थान',

    // Admin Dashboard
    'admin.title': 'सिस्टम प्रशासन',
    'admin.badge': 'सुपर एडमिन',
    'admin.tab_pending': 'लंबित स्वीकृतियां',
    'admin.tab_all_props': 'सभी लिस्टिंग्स',
    'admin.tab_users': 'उपयोगकर्ता व मालिक',
    'admin.tab_stats': 'प्लेटफ़ॉर्म आंकड़े',
    'admin.approve_btn': 'स्वीकृत करें और लाइव करें',
    'admin.reject_btn': 'अस्वीकार करें',
    'admin.add_user_btn': '+ नया उपयोगकर्ता जोड़ें',

    // Footer
    'footer.tagline': 'भीलवाड़ा का प्रमुख लक्जरी रियल एस्टेट पोर्टल जो खरीदारों और संपत्ति मालिकों को जोड़ता है।',
    'footer.quick_links': 'त्वरित लिंक',
    'footer.legal': 'गोपनीयता नीति और शर्तें',
    'footer.rights': 'सर्वाधिकार सुरक्षित।',

    // Common
    'common.dark_mode': 'डार्क मोड',
    'common.light_mode': 'लाइट मोड',
    'common.language': 'भाषा',
    'common.save': 'सहेजें',
    'common.saved': 'सहेजा गया',
    'common.view_details': 'विवरण देखें',
    'common.back_to_search': 'वापस खोज पर जाएं',
    'common.go_to_dashboard': 'मेरे डैशबोर्ड पर जाएं',

    // Property Card & Listing Statuses
    'card.for_buy': 'बिक्री हेतु',
    'card.for_rent': 'किराये हेतु',
    'card.sold': 'बिक गया 🏷️',
    'card.rented': 'किराए पर दिया 🏷️',
    'card.bath': 'बाथरूम',
    'card.floor': 'मंजिल',
    'card.floors': 'मंजिलें',
    'card.by': 'द्वारा:',
    'card.verified': 'सत्यापित',
    'card.verified_owner': 'सत्यापित मालिक',

    // Role Labels
    'role.buyer': 'खरीदार',
    'role.owner': 'संपत्ति मालिक',
    'role.admin': 'प्रशासक (Admin)',

    // Property Details Additional
    'detail.total_floors': 'कुल मंजिलें',
    'detail.bedrooms_count': 'बेडरूम',
    'detail.bathrooms_count': 'बाथरूम',
    'detail.built_area': 'निर्मित क्षेत्र',
    'detail.furnishing_status': 'फर्निशिंग स्थिति',
    'detail.property_type': 'संपत्ति का प्रकार',
    'detail.listing_type': 'लिस्टिंग प्रकार',
    'detail.price': 'कीमत',
    'detail.address': 'पता',
    'detail.locality': 'इलाका',
    'detail.city': 'शहर',
    'detail.state': 'राज्य',
    'detail.key_specs': 'प्रमुख विशेषताएं',
    'detail.listed_by': 'द्वारा लिस्टेड',
    'detail.open_maps': 'गूगल मैप्स में खोलें',

    // Contact Form
    'contact.office_address': 'कार्यालय का पता',
    'contact.phone_numbers': 'फ़ोन नंबर',
    'contact.email_address': 'ईमेल पता',
    'contact.looking_header': 'भीलवाड़ा में संपत्ति तलाश रहे हैं?',
    'contact.looking_desc': 'आर.सी. व्यास कॉलोनी स्थित हमारे कार्यालय में आएं या फ़ोन/ईमेल से सीधा मार्गदर्शन प्राप्त करें।',
    'contact.msg_sent': 'संदेश भेजा गया!',

    // Location Picker
    'map.interactive_picker': 'स्थान चुनने का डिजिटल नक्शा',
    'map.picker_subtitle': 'संपत्ति का स्थान तय करने के लिए नक्शे पर क्लिक करें या पिन खींचें',
    'map.quick_jump': 'भीलवाड़ा के मुख्य इलाकों पर जाएं:',
    'map.open_gmaps': 'गूगल मैप्स पर खोलें ↗',
    'map.gps_coords': 'जीपीएस निर्देशांक — पिन हिलाने पर लाइव अपडेट होते हैं',
    'map.use_my_location': 'मेरी वर्तमान जीपीएस लोकेशन का उपयोग करें',
  },
};

export function PreferencesProvider({ children }) {
  // Theme: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('bh_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Language: 'en' | 'hi'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('bh_lang') || 'en';
  });

  // First-Time Visitor Language Modal state (opens if no saved preference exists)
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(() => {
    const savedLang = localStorage.getItem('bh_lang');
    return !savedLang;
  });

  const handleSelectFirstTimeLanguage = (selectedLang) => {
    setLanguage(selectedLang);
    localStorage.setItem('bh_lang', selectedLang);
    setShowFirstTimeModal(false);
  };

  useEffect(() => {
    localStorage.setItem('bh_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bh_lang', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  // Translation helper
  const t = (key, fallback = '') => {
    const dict = translations[language] || translations.en;
    return dict[key] || fallback || key;
  };

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        language,
        isHindi: language === 'hi',
        toggleLanguage,
        setLanguage,
        t,
      }}
    >
      <FirstTimeLangModal
        isOpen={showFirstTimeModal}
        onSelectLanguage={handleSelectFirstTimeLanguage}
      />
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
