import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";

const PeopleAlsoBought = () => {
	const [recommendations, setRecommendations] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRecommendations = async () => {
			try {
				// DEBUG: Let's see what's happening
				console.log("Axios baseURL:", axios.defaults.baseURL);
				console.log("Making request to: products/recommendations");
				
				// Option 1: Try with debug
				const res = await axios.get("products/recommendations", {
					// Add timeout and debug
					timeout: 10000,
				});
				
				console.log("Success! Got data:", res.data);
				setRecommendations(res.data);
			} catch (error) {
				console.error("Full error details:", error);
				console.error("Error config:", error.config);
				console.error("Request URL was:", error.config?.baseURL + error.config?.url);
				
				// Try direct fetch as fallback
				try {
					console.log("Trying direct fetch...");
					const directResponse = await fetch("https://e-commerce-18gj.onrender.com/api/products/recommendations");
					if (directResponse.ok) {
						const data = await directResponse.json();
						console.log("Direct fetch worked!", data);
						setRecommendations(data);
						return;
					}
				} catch (fallbackError) {
					console.error("Fallback also failed:", fallbackError);
				}
				
				toast.error("Failed to load recommendations");
			} finally {
				setIsLoading(false);
			}
		};

		fetchRecommendations();
	}, []);

	if (isLoading) return <LoadingSpinner />;

	if (recommendations.length === 0) {
		return (
			<div className='mt-8'>
				<h3 className='text-2xl font-semibold text-emerald-400'>People also bought</h3>
				<p className='mt-4 text-gray-400'>No recommendations available at the moment.</p>
			</div>
		);
	}

	return (
		<div className='mt-8'>
			<h3 className='text-2xl font-semibold text-emerald-400'>People also bought</h3>
			<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{recommendations.map((product) => (
					<ProductCard key={product._id} product={product} />
				))}
			</div>
		</div>
	);
};

export default PeopleAlsoBought;